(function(angular) {
    let env = {};
    //assign the __env variable to the window so that the app can have access to it
    if(window){
        Object.assign(env, window.__env)
    }
    'use strict';
    angular.module('converterApp', ['ngResource', 'ngMaterial'])
        .constant('__env', env) // set up angular constant
        .factory('ProviderConverter', ($resource) => {
            //factory function to provide currency converter data
            let url = `${__env.converterApiUrl}?from=:from&to=:to&amount=:amount`;
            // pass in from symbol and to symbol and the amount to convert
            return $resource(url, {}, {
                get: {
                    method: 'GET',
                    from: 'from',
                    to: 'to',
                    amount: 'amount',
                    headers:{
                        'authorization': __env.converterApiKey
                    }
                },
            })
        })
        .factory('ProviderHistorical', ($resource) => {
            //factory to provide historical data
            let url = `${__env.historicalApiUrl}?from=:from&to=:to&start_timestamp=:startDate&end_timestamp=:endDate&amount=:amount`;
            return $resource(url, {}, {
                get: {
                    method: 'GET',
                    from: 'from',
                    to: 'to',
                    amount: 'amount',
                    startDate: 'startDate',
                    endDate: 'endDate',
                    headers:{
                        'authorization': __env.historicalApiKey
                    }
                },
            })
        })
        .factory('ProviderSymbols', ($resource) => {
            // factory to provide symbols on application load
            let url =  `${__env.symbolsApiUrl}symbols?${__env.apiKey}`;
            return $resource(url, {}, {
                get: {method: 'GET'},
            })
        })
        .service('apiConnectorService', ['ProviderConverter', 'ProviderSymbols', 'ProviderHistorical', function (ProviderConverter, ProviderSymbols, ProviderHistorical) {
            let symbols = [],//store symbols privately
                currentQuery = {},
                that = this;//store a reference to this function scope this variable
            this.load_symbols = function () {
                //load symbols on app run using new Promise and store them in the symbols array
                return new Promise(
                    function (resolve, reject) {
                        ProviderSymbols.get({}, (data) => {
                            if(data.success){
                                symbols = data.symbols;
                            }
                            resolve(data);
                        }, function (e) {
                            /*catch errors loading symbols*/
                            console.log(e);
                            reject();
                        });
                    }
                )
            };
            this.convert = function ({amount, from, to}) {
                //method used to convert currency passing th amount, from and to symbols
                return new Promise(
                    function (resolve, reject) {
                        ProviderConverter.get({amount, from, to}, (data) => {
                            if(data){
                                resolve(data);
                                currentQuery = data;
                            }
                        }, function (e) {
                            /* if there is an error then log it, this function could emit to the rootscope where it could trigger a notification to the user that something went wrong
                            this is outside the scope of my app, but if I would developer it further I add some notify function to catch errors.
                            */
                            console.log(e);
                            reject();
                        });
                    }
                )
            };
            this.get_historical = function ({to, from, amount, startDate, endDate}) {
                return new Promise(
                    function (resolve, reject) {
                        ProviderHistorical.get({to, from, amount, startDate, endDate}, (data) => {
                            console.log(data);
                            if(data){
                                resolve(data);
                            }
                        }, function (e) {
                            /* second location for error catching
                            */
                            console.log(e)
                            reject();
                        });
                    }
                )
            };
            //both getters are watched inside controllers for value changes
            this.get_current_query = function () {
                return currentQuery;
            };
            this.get_symbols = function () {
                return symbols;
            };
        }])
        .controller('converterController', ['$scope', 'apiConnectorService', '$http', function ($scope, apiConnectorService, $http) {
            $scope.service = apiConnectorService;
            $scope.$watchCollection('service.get_symbols()', function (n,o) {
                //watch when symbols change
                $scope.symbols = n;
            });

            $scope.result = null;
            $scope.data = {
                amountFrom: null,
                amountTo: null,
                from: '',
                to: ''
            };
            $scope.handleConvert = function () {
                //handle conversion of currency and wait for a result having passed the right
                $scope.service.convert({
                        amount: $scope.data.amountFrom,
                        from: $scope.data.from,
                        to: $scope.data.to
                    }).then(resp => {
                        $scope.result = resp;
                        $scope.$apply();
                })
            }
        }])
        .controller('graphController', ['$scope', 'apiConnectorService', function ($scope, apiConnectorService) {
            let today = new Date(), thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
            $scope.service = apiConnectorService;
            $scope.$watchCollection('service.get_current_query()', function (n, o) {
                //when the initial currency query has been made and is successful, look for historical data and populate the graph
                if(n.hasOwnProperty('timestamp')){
                    $scope.service.get_historical({
                        to: n.to[0].quotecurrency,
                        from: n.from,
                        amount: n.amount,
                        startDate: thirtyDaysAgo.toISOString(),
                        endDate: today.toISOString().substring(0,)
                    }).then(resp => {
                        $scope.build_graph(resp);
                        //build the graph with the response from historical data call
                    })
                }
            });
            $scope.build_graph = function(data){
                console.log(data);
                let dataElements = [];
                let cy = cytoscape({
                    //container: angular.element(document).find('cy'),
                    container: document.getElementById('cy'),// I wasn't sure to use the AngularJS's jqLite here, I don't have jQuery installed
                    boxSelectionEnabled: false,
                    // style the graph element  and nodes
                    style: cytoscape.stylesheet()
                        .selector('node')
                        .css({
                            'content': 'data(value)',
                            'width': 10,
                            'height': 10
                        })
                        .selector('edge')
                        .css({
                            'curve-style': 'bezier',
                            'width': 2,
                            'line-color': '#ddd'
                        })
                        .selector('.highlighted')
                        .css({
                            'background-color': '#61bffc',
                            'line-color': '#61bffc',
                            'target-arrow-color': '#61bffc',
                            'transition-property': 'background-color, line-color, target-arrow-color',
                            'transition-duration': '0.5s'
                        }),
                    elements: dataElements,
                    layout: {
                        name: 'preset',// 'preset allows for presetting node coordinates
                        fit: true
                    }
                });
                let key = Object.keys(data.to)[0];//find the only object key, that is the symbol related ot the 'TO' currency and loop over it's array
                for (let i = 0; i < data.to[key].length; i++){
                    dataElements.push(//format all elements so that cytoscape can render them, and push into an array
                        {
                            group: 'nodes',
                            classes: 'node',
                            data: {
                                id: i,
                                value: Math.floor(data.to[key][i].mid) + ' ' + data.to[key][i].timestamp.substring(0,10)
                            },
                            position: {
                                x: (cy.width() / 30) * i,
                                /*
                                I didn't get as far as representing the real data within the graph,
                                but I would need to convert each day's data to a to a percentage of the height of the cytoscape canvas and plot it on the y axis.
                                * */
                                //y: Math.random() * (cy.height() - 1) + 1//  (data.to[key][i].mid / cy.height()) × 100
                                y:(data.to[key][i].mid / cy.height()) × 100
                            },
                            selectable: false,
                            grabbable: false
                        }
                    );
                    if(i < data.length) {
                        //check before the last node so that we don't push an edge that will have no target node
                        dataElements.push(
                            {data: { id: `${i}${i + 1}`, source: i, target: i + 1 }}
                        );
                    }
                }
                cy.add(dataElements);//use the cytoscape cy.add method
            };
        }])
        .run(['apiConnectorService', function (apiConnectorService) {
            //load currency symbols on application load
            apiConnectorService.load_symbols();
        }]);
})(window.angular);
