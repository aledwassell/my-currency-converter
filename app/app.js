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
            let url = `${__env.historicalApiUrl}GetHistoricalRatesRanges?${__env.historicalApiKey}&Symbols=EURUSD&PriceType=Mid&StartDate=:startDate&EndDate=:endDate&PeriodType=Daily&FixingTime=22:00`;
            return $resource(url, {}, {
                query: {
                    method: 'GET',
                    startDate: 'startDate',
                    endDate: 'endDate',
                    isArray: true
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
                that = this;//store a reference to this function scope this variable
            let observerCallbacks = [],
                /*set up observer call backs, I think too many watchers in Angular can be quite heavy
                * so I think setting up observable callbacks is useful*/
                notifyAllObservers = function(){
                    //when something changes notify all the callback that are subscribed to it
                    angular.forEach(observerCallbacks, function(callback){
                        callback();
                    });
                };
            this.registerObserverCallback = function(callback){
                //register subscribers so that they are notified of callbacks
                observerCallbacks.push(callback);
            };
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
                                notifyAllObservers();
                            }
                        }, function (e) {
                            console.log(e);
                            reject();
                        });
                    }
                )
            };
            this.get_historical = function ({startDate, endDate}) {
                return new Promise(
                    function (resolve, reject) {
                        ProviderHistorical.query({startDate, endDate}, (data) => {
                            if(data){
                                resolve(data);
                            }
                        }, function (e) {
                            console.log(e);
                            reject();
                        });
                    }
                )
            };
            this.get_symbols = function () {
                return symbols;
            }
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
                        console.log(resp)
                        $scope.result = resp;
                        console.log($scope.result)
                        $scope.$apply();
                })
            }
        }])
        .controller('graphController', ['$scope', 'apiConnectorService', function ($scope, apiConnectorService) {
            $scope.service = apiConnectorService;
            $scope.service.registerObserverCallback(() => {
                $scope.service.get_historical({startDate: '10/01/2018', endDate: '10/12/2018'})
                    .then(resp => {
                        $scope.build_graph(resp);
                    })
            });
            $scope.service.get_historical({startDate: '10/01/2018', endDate: '10/12/2018'})
                .then(resp => {
                    $scope.build_graph(resp);
                });
            $scope.build_graph = function(data){
                let dataElements = [];
                for (let i = 0; i < data.length; i++){
                    dataElements.push(
                        {
                            group: 'nodes',
                            classes: 'node',
                            data: {
                                id: 1,
                                date: data[i].StartDate,
                                value: data[i].Average
                            },
                            position: {
                                x: 5,
                                y: data[i].Average
                            },
                            selectable: false,
                            grabbable: false
                        },
                    )
                }
                console.log(dataElements)
                let cy = cytoscape({
                    container: document.getElementById('cy'),

                    boxSelectionEnabled: false,

                    style: cytoscape.stylesheet()
                        .selector('node')
                        .css({
                            'content': 'data(id)',
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
                        directed: true,
                        roots: '#a',
                        padding: 10
                    }
                });
            }
        }])
        .run(['apiConnectorService', function (apiConnectorService) {
            //load currency symbols on application load
            apiConnectorService.load_symbols();
        }]);
})(window.angular);
