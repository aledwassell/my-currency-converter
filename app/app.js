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
                return new Promise(
                    function (resolve, reject) {
                        ProviderSymbols.get({}, (data) => {
                            if(data.success){
                                symbols = data.symbols;
                            }
                            resolve(data);
                        }, function (e) {
                            console.log(e);
                            reject();
                        });
                    }
                )
            };
            this.convert = function ({amount, from, to}) {
                return new Promise(
                    function (resolve, reject) {
                        ProviderConverter.get({amount, from, to}, (data) => {
                            if(data){
                                resolve(data);
                                currentQuery = data;
                            }
                        }, function (e) {
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
                            reject();
                        });
                    }
                )
            };
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
                console.log(n);
                if(n.hasOwnProperty('timestamp')){
                    console.log(n);
                    $scope.service.get_historical({
                        to: n.to[0].quotecurrency,
                        from: n.from,
                        amount: n.amount,
                        startDate: thirtyDaysAgo.toISOString(),
                        endDate: today.toISOString().substring(0,)
                    }).then(resp => {
                        $scope.build_graph(resp);
                    })
                }
            });
            $scope.build_graph = function(data){
                console.log(data);
                let dataElements = [];
                let cy = cytoscape({
                    container: document.getElementById('cy'),
                    boxSelectionEnabled: false,
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
                        name: 'preset',
                        fit: true
                    }
                });
                let key = Object.keys(data.to)[0];
                for (let i = 0; i < data.to[key].length; i++){
                    dataElements.push(
                        {
                            group: 'nodes',
                            classes: 'node',
                            data: {
                                id: i,
                                value: Math.floor(data.to[key][i].mid) + ' ' + data.to[key][i].timestamp.substring(0,10)
                            },
                            position: {
                                x: (cy.width() / 30) * i,
                                y: Math.random() * (cy.height() - 1) + 1
                            },
                            selectable: false,
                            grabbable: false
                        }
                    );
                    if(i < data.length) {
                        dataElements.push(
                            {data: { id: `${i}${i + 1}`, source: i, target: i + 1 }}
                        );
                    }
                }
                cy.add(dataElements);
            };
        }])
        .run(['apiConnectorService', function (apiConnectorService) {
            //load currency symbols on application load
            apiConnectorService.load_symbols();
        }]);
})(window.angular);
