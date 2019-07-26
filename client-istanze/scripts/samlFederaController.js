'use strict';

angular.module('myApp.controllers')

// landingSAMLCtrl ------------------------------------------------------------------------------------
.controller('landingSAMLCtrl',

           ['$scope', '$stateParams', 'dialogs', '$rootScope', 'AuthService', 'Session', '$state','ENV', '$log',
    function($scope,   $stateParams,   dialogs,   $rootScope,   AuthService,   Session,   $state,  ENV ,  $log ) {


    $log.info('landingSAMLCtrl...');
    
    // Verifica RelayState
    if($stateParams.RelayState) {
        // Match RelayState 
        if(AuthService.checkRelayStateToken($stateParams.RelayState)){
            if($stateParams.tokenId) {
                //$scope.tokenId = $stateParams.tokenId;
                //$log.info($scope.tokenId);        
                AuthService.storeToken($stateParams.tokenId);
                $log.info('landingSAMLCtrl: go to profile. ..');
                $state.go('profile');
            } else{
                $log.info('landingSAMLCtrl: No TokenId');
            }
        }else{
          $log.info('landingSAMLCtrl: RelayState NO MATCH!');  
        }
    } else{
        $log.info('landingSAMLCtrl: No RelayState');
    }

    $scope.isAuthenticated = function() {
      // return $auth.isAuthenticated();
      return AuthService.isAuthenticated();
    };



    $scope.getUserId = function() {

      if ($auth.isAuthenticated()) {
        return $auth.getPayload().sub.userId;
      } else {
        return '';
      }
      
    };

  }])

// landingGatewayFederaCtrl ------------------------------------------------------------------------------------
// azione di ritorno chiamato dal gateway federa
.controller('landingGatewayFederaCtrl',

           ['$scope', '$stateParams', '$rootScope', 'AuthService', 'Session', '$state','ENV', '$log',
    function($scope,   $stateParams,   $rootScope,   AuthService,   Session,   $state,  ENV ,  $log ) {

        $log.info('landingGatewayFederaCtrl...');
        $log.info('landingGatewayFederaCtrl:tokenId:',$stateParams.tokenId);
        $log.info('landingGatewayFederaCtrl:formId:',$stateParams.formId);

        
        // Verifica presenza del token
        if($stateParams.tokenId) {
            $log.info('landingGatewayFederaCtrl: STORE TOKEN. ..');
            AuthService.storeToken($stateParams.tokenId);
            $state.go('eseguiIstanzaDinamica', { id : $stateParams.formId} );
            // $log.info('landingGatewayFederaCtrl: go to profile. ..');
            // $state.go('profile');
        } else{
            $log.info('landingSAMLCtrl: No TokenId');
        };

        $scope.avviaIstanza = function() {
          $state.go('eseguiIstanzaDinamica', { id : $stateParams.formId} );
        }

        $scope.isAuthenticated = function() {
        // return $auth.isAuthenticated();
            return AuthService.isAuthenticated();
        };

  }]);