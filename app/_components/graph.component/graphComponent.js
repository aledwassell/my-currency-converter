(function(angular) {
    'use strict';
    function GraphController($scope, $element, $attrs) {
        let ctrl = this;
        ctrl.name = 'Aled';
    }

    angular.module('myApp').component('graph', {
        templateUrl: '_components/graph.component/graphTemplate.html',
        controller: GraphController
    });
})(window.angular);