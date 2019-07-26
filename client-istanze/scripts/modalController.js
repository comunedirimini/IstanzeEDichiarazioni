'use strict';

angular.module('myApp.controllers')

.controller('ModalController', 
            [  '$uibModalInstance','$scope', '$rootScope', 'ENV', 'AuthService','Session','$location','$http', '$state','$log',
       function ( $uibModalInstance, $scope,  $rootScope, ENV, AuthService, Session, $location,  $http, $state,$log ) {
    $log.info('HelpController...');
    
    //Restangular.setBaseUrl($rootScope.base_url); 

    //$scope.items = items;
    //$scope.selected = { item: $scope.items[0] };

    $scope.ok = function () {
        //$uibModalInstance.close($scope.selected.item);
        $uibModalInstance.close();
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

}]);