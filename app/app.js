(function(angular) {
    'use strict';
    angular.module('converterApp', ['ngResource'])
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
            console.log($scope.name);
        }])
        .run(['apiConnectorService', function (apiConnectorService) {
            apiConnectorService.load_symbols();
        }]);
})(window.angular);
