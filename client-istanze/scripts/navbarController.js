'use strict';

angular.module('myApp.controllers')

// SNavbarCtrl ------------------------------------------------------------------------------------
.controller('SNavbarCtrl',

           ['$scope', 'dialogs', '$rootScope', 'AuthService', 'Session', '$state','ENV', '$log',
    function($scope,   dialogs,   $rootScope,   AuthService,   Session,   $state,  ENV ,  $log ) {

    $scope.isCollapsed = false;

    $scope.isAuthenticated = function() {
      // return $auth.isAuthenticated();
      return AuthService.isAuthenticated();
    };

    $scope.isAdmin = function() {
      // return $auth.isAuthenticated();
      return AuthService.isAdmin();
    };

    $scope.switchCollapsed = function (){
        console.log($scope.isCollapsed);
        $scope.isCollapsed = !$scope.isCollapsed;
        console.log($scope.isCollapsed);
    }


    $scope.getUserId = function() {

      if ($auth.isAuthenticated()) {
        return $auth.getPayload().sub.userId;
      } else {
        return '';
      }
      
    };


}]);