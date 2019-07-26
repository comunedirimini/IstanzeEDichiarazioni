'use strict';

angular.module('myApp.controllers')

// HelpController ------------------------------------------------------------------------------------
.controller('HelpController', 
                   [ '$window','$scope', '$rootScope', 'ENV', '$location','$http', '$state','$log',
            function ($window, $scope,   $rootScope,   ENV,   $location,  $http,   $state,  $log ) {
    
     $log.info('HelpController...');
    
    $scope.testStampa = function() {

      $log.info('testStampa');
      var w = $window.open();
      // $window.print();
      // w=window.open();
      w.document.write('<html>');
      w.document.write('<body style="margin:30;padding:30">');
      w.document.write('<h3>Comune di Rimini - Notifica ricezione istanza</h3>');

      w.document.write('<h3>Riferimenti di protocollo</h3>');
      w.document.write('<p>Anno:Numero:Data:</p>');
      w.document.write('<h3>Riepilogo dati inseriti:</h3>');
     
    
      w.document.write('<table border="1">'); 

      for (var i=0; i < 20; i++) {
        w.document.write('<tr><td>'+ i + ':' + i  + '</td></tr>'); 
      }

      
      w.document.write('</table>'); 
      w.document.write('<h3>Data ora _______________________</h3>');
      w.document.write('<h3>Firma _______________________</h3>');
      w.document.write('</body>');
      w.document.write('</html>');
    
    
      w.print();
      setTimeout(function(){w.close();}, 10);
      
    }

    $scope.goto_login = function($id) {
        $log.info('HelpController : Route to login');
        $state.go('menu.login');
    };            
    
    

}]);