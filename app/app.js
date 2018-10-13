(function(angular) {
    'use strict';
    angular.module('converterApp', ['ngResource', 'ngMaterial'])
        .factory('ProviderConverter', ($resource) => {
            let apiUrl = 'http://data.fixer.io/api/latest?access_key=bda7bc1e7ca07a47d64040442d614a09';
            return $resource(apiUrl, {
                get: {method: 'GET'},
            }, {})
        })
        .factory('ProviderSymbols', ($resource) => {
            let apiUrl = 'http://data.fixer.io/api/symbols?access_key=bda7bc1e7ca07a47d64040442d614a09';
            return $resource(apiUrl, {
                get: {method: 'GET'},
            }, {})
        })
        .service('apiConnectorService', ['ProviderConverter', 'ProviderSymbols', function (ProviderConverter, ProviderSymbols) {
            let symbols = [];
            this.load_symbols = function () {
                return new Promise(
                    function (resolve, reject) {
                        ProviderSymbols.get({}, (data) => {
                            if(data.success){
                                symbols = data.symbols;
                            }
                            resolve(data);
                        });
                    }
                )
            };
            this.convert_by_baserate = function () {
                return ProviderConverter.get();
            }
            this.get_symbols = function () {
                return symbols;
            }
        }])
        .controller('wrapperController', ['$scope', function ($scope) {
            $http({
                method: 'GET',
                url: '/someUrl'
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
        }])
        .controller('converterController', ['$scope', 'apiConnectorService', function ($scope, apiConnectorService) {
            $scope.service = apiConnectorService;
            $scope.$watchCollection('service.get_symbols()', function (n,o) {
                console.log(n);
                $scope.symbols = $scope.service.get_symbols();
            });
            $scope.data = {
                from: '',
                to: ''
            }
        }])
        .controller('graphController', ['$scope', 'apiConnectorService', function ($scope, apiConnectorService) {
            $scope.service = apiConnectorService;
            let cy = cytoscape({
                container: document.getElementById('cy'),

                boxSelectionEnabled: false,
                autounselectify: true,

                style: cytoscape.stylesheet()
                    .selector('node')
                    .css({
                        'content': 'data(id)'
                    })
                    .selector('edge')
                    .css({
                        'curve-style': 'bezier',
                        'target-arrow-shape': 'triangle',
                        'width': 4,
                        'line-color': '#ddd',
                        'target-arrow-color': '#ddd'
                    })
                    .selector('.highlighted')
                    .css({
                        'background-color': '#61bffc',
                        'line-color': '#61bffc',
                        'target-arrow-color': '#61bffc',
                        'transition-property': 'background-color, line-color, target-arrow-color',
                        'transition-duration': '0.5s'
                    }),

                elements: {
                    nodes: [
                        { data: { id: 'a' } },
                        { data: { id: 'b' } },
                        { data: { id: 'c' } },
                        { data: { id: 'd' } },
                        { data: { id: 'e' } }
                    ],

                    edges: [
                        { data: { id: 'a"e', weight: 1, source: 'a', target: 'e' } },
                        { data: { id: 'ab', weight: 3, source: 'a', target: 'b' } },
                        { data: { id: 'be', weight: 4, source: 'b', target: 'e' } },
                        { data: { id: 'bc', weight: 5, source: 'b', target: 'c' } },
                        { data: { id: 'ce', weight: 6, source: 'c', target: 'e' } },
                        { data: { id: 'cd', weight: 2, source: 'c', target: 'd' } },
                        { data: { id: 'de', weight: 7, source: 'd', target: 'e' } }
                    ]
                },

                layout: {
                    name: 'breadthfirst',
                    directed: true,
                    roots: '#a',
                    padding: 10
                }
            });
        }])
        .run(['apiConnectorService', function (apiConnectorService) {
            apiConnectorService.load_symbols();
        }]);
})(window.angular);
