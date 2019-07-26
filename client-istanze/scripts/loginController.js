'use strict';

/* Controllers */

//angular.module('myApp.controllers', [])
angular.module('myApp.controllers')

// LoginController ------------------------------------------------------------------------------------
.controller('LoginController', 
                    [ '$http', '$scope', 'usSpinnerService', '$localStorage', '$rootScope', 'ENV', 'AuthService', 'UtilsService', '$state', '$stateParams', '$log',
            function ( $http, $scope,   usSpinnerService,   $localStorage,   $rootScope,   ENV,   AuthService,   UtilService,    $state,   $stateParams,   $log) {
    
  $log.info('-------------------------------------------------------------------');
  $log.info('LoginController...');
  $log.info('LoginController...currentUser:' + $scope.currentUser );
        
  $scope.user = {};
  $scope.user.email = '';
  $scope.user.password = '';
  $scope.loading = false;
  $scope.errorMessage = false;
    
  // $log.info('LoginController...fullApiEndpoint');
  // var fullApiEndpoint = $rootScope.base_url + '/' + ENV.apiLogin + '/' + AuthService.getRelayStateToken();
  // $log.info(fullApiEndpoint);
  // $scope.fullApiEndpoint = '';

  AuthService.getGatewayFederaUrl($stateParams.id)
    .then(function (res) {
      $log.info('LoginController: getGatewayFederaUrl : OK');
      $log.info(res);
      $scope.fullApiEndpoint = res.data.url;
    }, function (error) {
      $log.info('LoginController : getGatewayFederaUrl : ERROR'); 
      $log.info('error:', error); 
    
      $scope.loading = false;
      $scope.errorMessage = error;
      if(error.status == 0){
          $scope.errorMessage = '0';
      } else {
          $scope.errorMessage = 'Login getGatewayFederaUrl! Riprova!';
      }
  });
 
  
$scope.newGatewayFederaUrl = function() {
  $log.info('LoginController : rinnova il token di richiesta'); 
  AuthService.getGatewayFederaUrl($stateParams.id)
  .then(function (res) {
    $log.info('LoginController: getGatewayFederaUrl : OK');
    $log.info(res);
    $scope.fullApiEndpoint = res.data.url;
  }, function (error) {
    $log.info('LoginController : getGatewayFederaUrl : ERROR'); 
    $log.info('error:', error); 
  
    $scope.loading = false;
    $scope.errorMessage = error;
    if(error.status == 0){
        $scope.errorMessage = '0';
    } else {
        $scope.errorMessage = 'Login getGatewayFederaUrl! Riprova!';
    }
});
};     

   
             
 $scope.goto_help = function($id) {
        $log.info('LoginController : Route to login');
        $state.go('menu.help');
 };     
                
 $scope.fullscreenOn = function(){
        $log.info('LoginController : fullscreenOn');
        //console.log('AboutController : fullscreen enabled? : ' + screenfull.enabled);
        //screenfull.request();
 };

 $scope.fullscreenOff = function(){
        $log.info('LoginController : fullscreenOff');
        //console.log('AboutController : fullscreen enabled? : ' + screenfull.enabled);
        //screenfull.exit();
 };            
                        
       
 $scope.clearPasswordCache = function(){
        $log.info('LoginController:clearPasswordCache');
        $localStorage.password = '';
        $scope.credentials.password = '';
    };

  /*

  $scope.login = function () {

      $log.info('LoginController : login');
      $scope.loading = true;

      // usSpinnerService.spin('spinner-1');
      //$ionicLoading.show({template: 'Attendere...' });
      
      $log.info(credentials);

      var credentials = {
          username: $scope.user.email,
          password: $scope.user.password
      };

    AuthService.loginLDAP(credentials).then(function (res) {
        $log.info('LoginController : OK');
        $log.info(res);
        $scope.loading = false;
        
        //$ionicLoading.hide();
        $rootScope.$broadcast(ENV.AUTH_EVENTS.loginSuccess);

    }, function (error) {
      $log.info('LoginController : login : ERROR'); 
      $log.info('error:', error); 
      //$ionicLoading.hide();
      $scope.loading = false;
      $scope.errorMessage = error;
      if(error.status == 0){
        $scope.errorMessage = '0';
      } else {
        $scope.errorMessage = 'Login Fallito! Riprova!';
      }

    });
  };

  */

  $scope.logout = function (credentials) {
      $log.info('LoginController : logout ');
      $log.info(credentials);
      
      delete $localStorage.JWT;
      delete $localStorage.userData;
      $http.defaults.headers.common.Authorization = '';

      $log.info('LoginController : nessuna chiamata al gateway per LOGOUT solo rimozione token autenticazione');

      /*

      NESSUNA CHIAMATA AL 

    AuthService.logout(credentials).then(function () {
        $log.info('LoginController : logout broadcast... ');
        $rootScope.$broadcast(ENV.AUTH_EVENTS.logoutSuccess);
       
    }, function (err) {
        $log.info('LoginController : logout err');
        $log.info(err);
        $rootScope.$broadcast(ENV.AUTH_EVENTS.logoutSuccess);
    });

    */
  };



    
  $scope.isAuthenticated = function(){
      $log.info('LoginController : isAuthenticated : ' + AuthService.isAuthenticated());
      return  AuthService.isAuthenticated();  
  }


 $scope.loginLDAP = function() {
      $log.info('LoginController : LoginLDAP');
      usSpinnerService.spin('spinner-1');

      var credentials = {
          username: $scope.user.email,
          password: $scope.user.password
      };

      $log.info(credentials);
 
      AuthService.loginLDAP(credentials)
        .then(function() {
          usSpinnerService.stop('spinner-1');
          $log.info('LoginController : NTLMLogin success');
          $rootScope.$broadcast(ENV.AUTH_EVENTS.loginSuccess);
        })
        .catch(function(error) {
          usSpinnerService.stop('spinner-1');
          $log.info('LoginController : NTLMLogin ERROR');
          $log.info(error);
          if (error.data) {
            $rootScope.$broadcast(ENV.AUTH_EVENTS.loginFailed);
          } else
            $rootScope.$broadcast(ENV.AUTH_EVENTS.loginFailed);
        });
    };



 $scope.NTLMLogin = function(credentials) {
      $log.info('LoginController : NTLMLogin');
 
      AuthService.loginNTLM()
        .then(function() {
          $log.info('LoginController : NTLMLogin success');
          $rootScope.$broadcast(ENV.AUTH_EVENTS.loginSuccess);
        })
        .catch(function(error) {
          $log.info('LoginController : NTLMLogin ERROR');
          $log.info(error);
          if (error.data) {
            $rootScope.$broadcast(ENV.AUTH_EVENTS.loginFailed);
          } else
            $rootScope.$broadcast(ENV.AUTH_EVENTS.loginFailed);
        });
    };

 $scope.DEMOLogin = function() {
      $log.info('LoginController : DEMOLogin');
 
      AuthService.loginDEMO()
        .then(function() {
          $log.info('LoginController : DEMOLogin success');
          $rootScope.$broadcast(ENV.AUTH_EVENTS.loginSuccess);
        })
        .catch(function(error) {
          $log.info('LoginController : DEMOLogin ERROR');
          $log.info(error);
          if (error.data) {
            $rootScope.$broadcast(ENV.AUTH_EVENTS.loginFailed);
          } else
            $rootScope.$broadcast(ENV.AUTH_EVENTS.loginFailed);
        });
    };
 


}]);