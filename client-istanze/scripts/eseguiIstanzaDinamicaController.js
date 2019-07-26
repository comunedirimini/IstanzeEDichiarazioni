'use strict';

/* Controllers */

//angular.module('myApp.controllers', [])
angular.module('myApp.controllers')

.controller('eseguiIstanzaDinamicaCtrl', 
            ['$window','$rootScope','$scope', '$http', '$state', '$stateParams', 'Upload', '$log', '$timeout','ENV','UtilsService', 
     function($window, $rootScope,  $scope,   $http,   $state,  $stateParams,    Upload ,  $log,   $timeout,  ENV,  UtilsService  ) {
    
  $log.info('eseguiIstanzaDinamicaCtrl', $stateParams.id);    
  
  $scope.loading = true;
  $scope.iC = {};
  $scope.iC.idIstanza = 0;

  $scope.iC.statoIstanza = 198;
  
  $scope.iC.btnInviaDati = 'CLICCA PER INVIARE I DATI';
  $scope.iC.btnDisabled = false;
  $scope.iC.errorMsg = '';
  $scope.iC.errorTitle = '';
  $scope.iC.successTitle = '';
  $scope.iC.successMsg = {};
  $scope.iC.successHtmlMsg = {};
  $scope.iC.successHtmlMsg.annoProtocollo = '';
  $scope.iC.successHtmlMsg.numeroProtocollo = '';
  $scope.iC.successHtmlMsg.dataProtocollo = '';
  $scope.iC.loggedUser = {};
  $scope.iC.logoRicevuta = '';


  $scope.info = {};
  $scope.info.file1 = {};
  $scope.info.file2 = {};
  $scope.info.file3 = {};
  
  $scope.modelForm = {};
 
  $scope.model = {};
  $scope.user = {};
  var files = [];

  $scope.vm = {};
  $scope.vm.form = 'form1';
  $scope.vm.exampleTitle = 'Introduction';

  $scope.token = '';

  // $scope.showLoader = function() { $scope.iC.statoIstanza = 199; }

  $scope.acceptCookiePolicy = function () {
    $scope.iC.statoIstanza = 0;
  }

  $scope.logout = function () {
    $log.info('eseguiIstanzaDinamicaCtrl: goLogin ...');
    $state.go('login');
  }

  $scope.loggedUserVoid = function() {
    // console.log('>>>>',  $scope.iC.loggedUser);
    // console.log(Object.keys($scope.iC.loggedUser).length === 0);
    return Object.keys($scope.iC.loggedUser).length === 0;
  };

  $scope.inviaDati = function() {
    $log.info('eseguiIstanzaDinamicaCtrl: inviaDati');
    var fullApiEndpoint = $rootScope.base_url + '/' + ENV.apiIstanzeUploadDinamico + '/' + $stateParams.id;
    $log.info('eseguiIstanzaDinamicaCtrl: inviaDati : ' + fullApiEndpoint );
    // $scope.modelForm.RecaptchaResponse = 'RecaptchaResponseMARIO';
    // $log.info($scope.vm.model.RecaptchaResponse);

    var data = angular.copy($scope.vm.model);

    console.log(files);
    console.log(data); //data contains files if uploaded

    $scope.iC.statoIstanza = 199;
    $scope.iC.btnInviaDati = 'INVIO IN CORSO...ATTENDERE';
    $scope.iC.btnDisabled = true;
    Upload.upload({
        url: fullApiEndpoint,
        method: 'POST',
        //files: vm.options.data.fileList
        headers: {  'ISTANZE-API-KEY': $scope.iC.token, 
                    'RECAPTCHA-TOKEN': $scope.iC.captchaId,
                    'RECAPTCHA-TOKEN-VAL': $scope.vm.model.svgCaptchaResponse
                  }, // only for html5
        data: { fields: $scope.vm.model, files: files } 
    }).then(function (response) {
        $log.info('Success ');
        $log.info(response);
        $scope.iC.statoIstanza = response.status;
        $scope.iC.successMsg= response.data.msg;
        $scope.iC.successHtmlMsg= response.data.htmlMsg;
        $scope.iC.successTitle= response.data.title;
        $scope.iC.successTxtMsg= response.data.txtMsg;
        //usSpinnerService.stop('spinner-1');
    }, function (response) {
        $log.info('Error status: ' + response.status);
        $log.info(response.status);
        $scope.iC.statoIstanza = response.status;
        $scope.iC.errorMsg= response.data.msg;
        $scope.iC.errorTitle= response.data.title;
        $scope.iC.successTxtMsg= response.data.txtMsg;
        $scope.iC.reqId= response.data.reqId;
       
    }, function (evt) {
        var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
        $log.info(progressPercentage);
    });

};


$scope.caricaImpostazioni = function(){
        $log.info('eseguiIstanzaDinamicaCtrl: caricaImpostazioni');
        var fullApiEndpoint = $rootScope.base_url + '/' + ENV.apiIstanzeRecuperaImpostazioni + '/' + $stateParams.id;
        $log.info('eseguiIstanzaDinamicaCtrl: caricaImpostazioni : ' + fullApiEndpoint );
        $http.get(fullApiEndpoint)
            .then(function(response) {
                $log.info(response);
   
                $scope.iC.btnInviaDati = 'CLICCA PER INVIARE I DATI';
                $scope.iC.btnDisabled = false;
            
                $scope.iC.formDebug = response.data.formDebug;

                $scope.iC.contattiFooter = response.data.contattiFooter;
                $scope.iC.token = response.data.token;
                $scope.iC.captchaId = response.data.captchaId;
                $scope.iC.idIstanza = response.data.idIstanza;
                $scope.iC.loggedUser = response.data.loggedUser;
                
                // decodifica se esiste la data di expiration del timeout
                if ($scope.iC.loggedUser.exp) {
                  console.log(moment.unix($scope.iC.loggedUser.exp).format('llll'));
                  var mExpirationTime = moment.unix($scope.iC.loggedUser.exp);
                  console.log(mExpirationTime.format('DD/MM/YYYY, HH:mm:ss'));
                  $scope.iC.loggedUser.timeoutLogin = mExpirationTime.format('DD/MM/YYYY, HH:mm:ss');
                }

                $scope.iC.logoRicevuta = response.data.logoRicevuta;

                //$scope.vm.fields =  response.data.vm_fields;         
                $scope.vm.fields = JSON.parse(response.data.vm_fields, UtilsService.functionReviver);
                
                $scope.vm.model =  response.data.vm_model;   
                $scope.iC.statoIstanza = 0;      

                $log.info($scope.iC);

        }).catch(function(response) {
   
            $log.info('eseguiIstanzaDinamicaCtrl: caricaImpostazioni:ERRORE');
            $log.info(response);
            $log.info(response.status);
            $scope.iC.statoIstanza = response.status;
            $scope.iC.errorMsg= response.data.msg;
            $scope.iC.errorTitle= response.data.title;

            if (response.status == 999) {
                $log.info('redirect to login page');
                $state.go('login', {id: $stateParams.id});
            }

        });      
};



$scope.apriAnteprimaStampa = function() {
  console.log('apriAnteprimaStampa');
  var w = $window.open();
  // $window.print();
  // w=window.open();
  w.document.write('<html>');
  w.document.write('<body style="margin:30;padding:30">');
  var strImg = '<img class="img-responsive center-block" src="' + $scope.iC.logoRicevuta +  '">';
  console.log(strImg);
  w.document.write(strImg);
  w.document.write('<h3>Comune di Rimini - Notifica ricezione istanza</h3>');
  w.document.write('<p>' + $scope.iC.successTxtMsg +  '</p>');
  w.document.write('<h3>Riferimenti di protocollo</h3>');
  w.document.write('<p>Anno:'+ $scope.iC.successHtmlMsg.annoProtocollo);
  w.document.write(' Numero:' + $scope.iC.successHtmlMsg.numeroProtocollo);
  w.document.write(' Data:' + $scope.iC.successHtmlMsg.dataProtocollo + '</p>');
  w.document.write('<h3>Riepilogo dati inseriti:</h3>');
 

  w.document.write('<table border="1">'); 
  var objS = $scope.iC.successMsg;
  Object.keys(objS).forEach(function(item) {
    console.log('item :', item, objS[item]);
    w.document.write('<tr><td>'+ objS[item].desc + ':' + objS[item].value  + '</td></tr>'); 
  });
  w.document.write('</table>'); 

  w.document.write('<h3>Data ora _______________________</h3>');
  w.document.write('<h3>Firma _______________________</h3>');
  w.document.write('</body>');
  w.document.write('</html>');


  w.print();
  w.close();
};


$scope.caricaImpostazioni();

$log.info('eseguiIstanzaDinamicaCtrl: caricaImpostazioni');


$scope.vm.options = {
    formState:{
        ngfChange: function(id, file, eventType){

          console.log('--ngfChange--');
          console.log(id);
          console.log(file);
          console.log(eventType);
          
          if(eventType == "click"){
            delete files[id];
          } 
          
          if(eventType == "change"){
            files[id] = file;
          }
         
        }
      }
};



}]);

