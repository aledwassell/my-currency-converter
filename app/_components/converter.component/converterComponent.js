(function(angular) {
    'use strict';
    function ConverterController($scope, $element, $attrs) {
        let ctrl = this;
        ctrl.name = 'Aled';
    }

    angular.module('myApp').component('converter', {
        templateUrl: '_components/converter.component/converterTemplate.html',
        controller: ConverterController
    });
})(window.angular);