var express = require('express');
var router = express.Router();
var fs = require('fs');
var _ = require('lodash');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var multiparty = require('multiparty');
var email = require('emailjs');
var serverEmail  = email.server.connect({
    host:    "srv-mail.comune.rimini.it", 
    ssl:     false
});
// http://embed.plnkr.co/iwZplV/
var moment = require('moment');
var async = require('async');
var validator = require('validator');

var ENV   = require('../config/config-ISTANZE.js'); 
var ENV_PROT   = require('../config/configPROTOCOLLO.js'); 

var uM = require('../models/utilityModule.js'); 
uM.setEnv(ENV);

var lmw = require('../models/loggerModuleWinston.js');
var log = lmw.buildRotateFileLogger(ENV.logWinstonConfig.logPath,ENV.logWinstonConfig.logName);
var logConsole = lmw.buildConsoleLogger();

var pM = require("../models/protocolloModule.js");

logConsole.info('Protocollo.js:start!');

module.exports = function(){


/*  getGatewayAuthUrl

    richiamata dal client NON NECESSITA AUTENTICAZIONE
    prepara la url per accesso al gateway di autenticazione
        
*/

router.get('/getGatewayAuthUrl/:formId', function(req, res) {

    logConsole.info('--------------------------------------------------------------------');
    logConsole.info('Protocollo.js:getGatewayAuthUrl Cookies: ', req.cookies);
    var fId = '';

    if (!req.params.formId) {
      logConsole.info('Protocollo.js:getGatewayAuthUrl:formId:NOT FOUND');
      res.status(500).send('getGatewayAuthUrl:formId:NOT FOUND');
      return;
    } else {
      var msg = {}
  
      // Verifico che la configurazione per il formId esiste
      fId = req.params.formId;
      var fConfigName = ENV_PROT.baseFolder + '/' + ENV_PROT.configUserFolder + '/' + ENV_PROT.configFilePREFIX + '-' + fId + '.js';
      // var fConfigName = ENV_PROT.configUserFolder + '/' + ENV_PROT.configFilePREFIX + '-' + user.userCompany + '.js';
      logConsole.info('Protocollo.js:loadingDefault : load default data : ' + fConfigName);

      try {
          ENV_FORM_CONFIG = require(fConfigName);
          // logConsole.info(ENV_FORM_CONFIG);
      }
      catch (e) {
          log.error(e);
          ErrorMsg = {
              title: 'Errore loadingDefault messaggio',
              msg: 'Errore loadingDefault messaggio di risposta. ',
              code : 459
          }
          res.status(459).send(ErrorMsg);
          return;
      }

      // prepara la url per l'accesso al gateway
      // nel token devo passare una serie di parametri che devono tornare indietro ad autenticazione 
      // avvenuta a seconda della istanza
  
      // operazioni per la preparazione dei dati che vuole il gateway
      // cifrare il token con la chiave segreta, fare base64, passarlo al client
  
      // ENV.appLandingUrl
      // ENV.gatewayAuthUrl
      var uuid = require('uuidv4'); 
      var uuidStr = uuid();
      var sToReturn = ENV.gatewayFederaClientId + ";" + uuidStr;
      //var sToReturn = req.params.formId + ";http1" ;

      // SALVARE uuidSrt nella lista dei token generati
      uM.addTokenToList(uuidStr, fId);
      
      let iv = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      // iv = 'FAKEIV1234567890';
      logConsole.info('Protocollo.js:iv:', iv);

      var dataEncrypted = uM.encryptStringWithAES_64(sToReturn, iv);
      logConsole.info('Protocollo.js:sToReturn:', sToReturn);
  
      msg.token = uM.createJWT('federaToken');
      msg.id = req.params.formId;
      msg.url = ENV.gatewayAuthUrl + '?appId=' + ENV.gatewayFederaClientId + '&data=' + iv + dataEncrypted;
    }
    
    logConsole.info('Protocollo.js:msg:',msg);
    
    //utilityModule.test();
    
    //User.findOne({ email: req.body.email }, '+password', function(err, user) {
    log.info('['+ fId + '] getGatewayAuthUrl: ', msg );
    res.send(msg);
  
});
  
/* gwLanding

   Route di ritorno da autenticazione gateway 
   Questo path viene chiamato dal gateway ad autenticazione avvenuta

*/

router.get('/gwLanding', function (req, res) {
        logConsole.info('Protocollo.js : gwLanding ');
        logConsole.info(req.query.data);
        logConsole.info(req.query.iv);
        // logConsole.info('Save auth transaction to db');
                
        var data2decrypt = (req.query.data).substring(16);
        var dataIV = (req.query.data).substring(0,16);
       
        var dataDecrypted = uM.decryptStringWithAES_64(data2decrypt, dataIV);
        logConsole.info('Protocollo.js: ', dataDecrypted);

        // TODO verificare se il token

        var dataSplitted  = dataDecrypted.split(";");

        logConsole.info('---------------------------------------------------------------------');
        logConsole.info(dataSplitted);
        logConsole.info('---------------------------------------------------------------------');

        var userData = {};

        userData.transactionId = dataSplitted[0];
        userData.nameId = dataSplitted[1];
        userData.authenticationMethod = dataSplitted[2];
        userData.authenticatingAuthority = dataSplitted[3];
        userData.spidCode = dataSplitted[4];
        userData.policyLevel = dataSplitted[5];
        userData.trustLevel = dataSplitted[6];
        userData.userId = dataSplitted[7];
        userData.codiceFiscale = dataSplitted[8];
        userData.nome = dataSplitted[9];
        userData.cognome = dataSplitted[10];
        userData.dataNascita = dataSplitted[11];
        userData.luogoNascita = dataSplitted[12];
        userData.statoNascita = dataSplitted[13];
        
        
        // controlla che l'id di transazione sia tra quelli generati e quindi autorizzati
        // poi genero il token di autenticazione da utilizzare nelle comunicazioni successive

        logConsole.info('Protocollo.js:gwLanding userData ', userData);
        log.info('Protocollo.js:gwLanding userData:', userData);
        if (uM.existsTokenInList(userData.transactionId)) {
           
            var fileContent = uM.removeTokenFromList(userData.transactionId);
            logConsole.info('Protocollo.js : gwLanding: form:', fileContent);
            var token = uM.createJWT(userData);

            // redirezione condizionale se in produzione su dist se in test su cli

            if (ENV.production) {
                var url2redirect = '/dist/#!/landingGatewayFedera/' + token + '/' + fileContent;
                logConsole.info('Protocollo.js : PRODUZIONE redirect to:', url2redirect);
                res.redirect(url2redirect);
            } else {
                var url2redirect = '/cli/#!/landingGatewayFedera/' + token + '/' + fileContent;
                logConsole.info('Protocollo.js : TEST redirect to:', url2redirect);
                res.redirect(url2redirect);
            }

            
        } else {
            log.error('Protocollo.js:gwLanding: TOKEN NOT EXISTS:', userData);
            res.status(500).send({msg: 'TOKEN NOT EXISTS'});
        }

        
        // con l'utente generare il token e ritornarlo al chiamante..
        
        // res.redirect('/simplesaml/cli/#/landingSAML/' + token + '/' + req.body.RelayState);
        // res.status(200).send({msg: 'ok'});
});

/* Restituisce la configurazione del form */

router.get('/getInfoIstanza/:formId', function (req, res) {

    logConsole.info('Protocollo.js:/getInfoIstanza/');

    if(!req.params.formId){
        log.error('getInfoIstanza:NOT FOUND');
        log.error(reqId);
        res.status(500).send('getInfoIstanza:NOT FOUND');
        return;
    } else {

        var fId = req.params.formId;
        logConsole.info('Protocollo.js:getInfoIstanza:len:' + fId.length);

        if(fId.length > 8) {
            logConsole.info('Protocollo.js:getInfoIstanza:len: TROPPO LUNGA');
            ErrorMsg = {
                title: 'Errore loadingDefault messaggio',
                msg: 'Errore loadingDefault messaggio di risposta. ',
                code : 458
            }
            res.status(458).send(ErrorMsg);
            return;
        }

        var fConfigName = ENV_PROT.baseFolder + '/' + ENV_PROT.configUserFolder + '/' + ENV_PROT.configFilePREFIX + '-' + fId + '.js';
        // var fConfigName = ENV_PROT.configUserFolder + '/' + ENV_PROT.configFilePREFIX + '-' + user.userCompany + '.js';
        logConsole.info('Protocollo.js:loadingDefault : load default data : ' + fConfigName);
 
        try {
            ENV_FORM_CONFIG = require(fConfigName);
            logConsole.info(ENV_FORM_CONFIG);
        }
        catch (e) {
            logConsole.error(e);
            log.error(e);
            ErrorMsg = {
                title: 'Errore loadingDefault messaggio',
                msg: 'Errore loadingDefault messaggio di risposta. ',
                code : 459
            }
            res.status(459).send(ErrorMsg);
            return;
        }

        // verifica se richiesta autenticazione
        logConsole.info('Protocollo.js: auth enable ?');
        var loggedUser = {};
        if(ENV_FORM_CONFIG.authEnable){

            logConsole.info('Protocollo.js: auth enable >> check!');

            // recuperare loggedUser ... 
            loggedUser = uM.ensureAuthenticatedFun(req);
            logConsole.info('Protocollo.js: loggedUser:', loggedUser);
            if (loggedUser){
                logConsole.info('Protocollo.js: logged go!');
            } else {
                logConsole.info('Protocollo.js: NOT AUTH TOKEN!'); 
                log.error('Protocollo.js: NOT AUTH TOKEN!');
                ErrorMsg = {
                    title: 'Eseguire autenticazione',
                    msg: 'Eseguire autenticazione',
                    code : 999
                }
                res.status(999).send(ErrorMsg);
                return;
            }
            /*
            if (!uM.ensureAuthenticatedFun(req)){

            } else {

            }
            */
        }

        // verifica se ci sono date di validità e controlla
        
        if(ENV_FORM_CONFIG.startDate) {
            logConsole.info('Protocollo.js: Check periodo di validita'); // cli/#!/login/D
            // moment('2010-10-20').isBetween('2010-10-19', '2010-10-25');
            var date = moment("15/02/2013", "DD/MM/YYYY");
            var startDate = moment(ENV_FORM_CONFIG.startDate, "DD/MM/YYYY");
            var endDate = moment(ENV_FORM_CONFIG.endDate, "DD/MM/YYYY");
            logConsole.info('Protocollo.js: startDate:', startDate); 
            logConsole.info('Protocollo.js: endDate:', endDate); 
            logConsole.info('Protocollo.js: nowDate:', moment()); 
            logConsole.info('Protocollo.js: is between:', moment().isBetween(startDate, endDate));
            if(!moment().isBetween(startDate, endDate)){
                ErrorMsg = {
                    title: 'Modulo non attivo',
                    msg: 'Modulo non attivo',
                    code : 998
            }
            res.status(998).send(ErrorMsg);
            return;
            }
        }

        var objRet = {};
        objRet.loggedUser = loggedUser;
        objRet.idIstanza = ENV_FORM_CONFIG.idIstanza;
        objRet.formDebug = ENV_FORM_CONFIG.formDebug;
        objRet.logoRicevuta = ENV_FORM_CONFIG.logoRicevuta;
        objRet.statoIstanza = 0;
        // jsonString = JSON.stringify(person, functionReplacer);
        // per invio dati dinamici
        
        //objRet.vm_fields = btoa(String.fromCharCode.apply(null, new Uint8Array(ENV_FORM_CONFIG.vm_fields)));
        objRet.vm_model = ENV_FORM_CONFIG.vm_model;

        var token = uM.createJWT(uM.getTimestampPlusRandom(), 5, 'h');
        logConsole.info(token);
        // Sicurezza : aggiunta token alla lista per la verifica delle richieste istanza
        uM.addTokenToList(token);
        objRet.token = token;

        // cerca e sostituisce nel form

        var svgCaptcha = uM.createSvgCaptcha();
        objRet.captchaId = svgCaptcha.captchaId;

        if(ENV_FORM_CONFIG.vm_fields.find(x => x.key === 'svgCaptchaResponse')) {

        ENV_FORM_CONFIG.vm_fields.find(x => x.key === 'svgCaptchaResponse').templateOptions.description = "";
        ENV_FORM_CONFIG.vm_fields.find(x => x.key === 'svgCaptchaResponse').templateOptions.label = "ATTENZIONE: Inserire " + svgCaptcha.captchaInfoText + " del numero visualizzato sopra";
        ENV_FORM_CONFIG.vm_fields.find(x => x.key === 'svgCaptchaResponse').templateOptions.svgImage = svgCaptcha.captchaSvgImage;

        } else {

            logConsole.info('Protocollo.js ########ERRORE nel form manca la sezione relativa a svgCaptcha');
            res.status(500).send('Protocollo.js ########ERRORE nel form manca la sezione relativa a svgCaptcha');
        }

        objRet.vm_fields = JSON.stringify(ENV_FORM_CONFIG.vm_fields,uM.functionReplacer);

        // Sicurezza invio della svg e della domanda e memorizzazione

        var Msg = {
            "documentId" : ENV_FORM_CONFIG.idIstanza,
            "actionId": "ISTANZA_RICHIESTA",
            "idIstanza": ENV_FORM_CONFIG.idIstanza,
            "code": 998
        }
        
        // logElastic.info(Msg);

        log.info('getInfoIstanza: ', { fId: fId, headers: req.headers });

        // console.log(req);

        res.status(200).send(objRet);
        return;
    }
});


/* UPLOAD ROUTE FORM DINAMICO FOrMLY--------------------------------------------------------------------------------------------------------- */
/* UPLOAD ROUTE FORM DINAMICO FOrMLY--------------------------------------------------------------------------------------------------------- */
/* UPLOAD ROUTE FORM DINAMICO FOrMLY--------------------------------------------------------------------------------------------------------- */
/* UPLOAD ROUTE FORM DINAMICO FOrMLY--------------------------------------------------------------------------------------------------------- */
/* UPLOAD ROUTE FORM DINAMICO FOrMLY--------------------------------------------------------------------------------------------------------- */
/* UPLOAD ROUTE FORM DINAMICO FOrMLY--------------------------------------------------------------------------------------------------------- */

//router.post('/upload', multipartMiddleware, function(req, res) {
    router.post('/uploadDinamico/:formId', 
    // uM.ensureAuthenticated,
    // uM.recaptchaVerifier,
    uM.checkIfTokenInList,
    function(req, res) {

    logConsole.info('UPLOAD@DINAMICO: START ############################################################');
    logConsole.info('UPLOAD@DINAMICO: start with formId: ', req.params.formId);

    var bRaisedError = false;
    var ErrorMsg = {};
    var ENV_FORM_CONFIG = {};
    var ID_ISTANZA = 'ID_ISTANZA_NON_ASSEGNATA';
    

    // richiesta di identificatore unico di transazione
    var reqId = uM.getTimestampPlusRandom();

    logConsole.info('UPLOAD@DINAMICO: reqId: ' + reqId);

    ErrorMsg.reqId = reqId;

    var objFilesList = {};
    var objFieldList = {};
    var objFieldSanitized = {};
    var objDatiProtocollo = {};
    var objModelloTestuale = {};
    var htmlResponseMsg = '';
    var supportMsg = ENV_PROT.supportMsg;

    var loggedUser = {};
   
   
    // limite upload
    // https://github.com/expressjs/node-multiparty

    async.series([

        // ##### d LOADING default ---------------------------------------
        function(callback){
            logConsole.info('UPLOAD@DINAMICO: loadingDefault: start----------------------------------------------------------------');

            if(!req.params.formId){
                log.error('UPLOAD@DINAMICO loadingDefault:formId property not found');
                log.error(reqId);
                ErrorMsg = {
                    title: 'Errore loadingDefault messaggio',
                    msg: 'Errore loadingDefault messaggio di risposta. ',
                    code : 459
                }
                callback(ErrorMsg, null);
            } else {
                var fConfigName = ENV_PROT.baseFolder + '/' + ENV_PROT.configUserFolder + '/' + ENV_PROT.configFilePREFIX + '-' + req.params.formId + '.js';
                // var fConfigName = ENV_PROT.configUserFolder + '/' + ENV_PROT.configFilePREFIX + '-' + user.userCompany + '.js';
                logConsole.info('UPLOAD@DINAMICO: loadingDefault: load default data: ' + fConfigName);
         
                try {
                    ENV_FORM_CONFIG = require(fConfigName);
                    ENV_FORM_CONFIG.reqId = reqId;
                    ID_ISTANZA = '[' + ENV_FORM_CONFIG.idIstanza + ']';
                    logConsole.info(ID_ISTANZA);
                    callback(null, 'UPLOAD: ASYNC loadingDefault success!');
                }
                catch (e) {
                    log.error(ID_ISTANZA, e);
                    ErrorMsg = {
                        title: 'Errore loadingDefault messaggio',
                        msg: 'Errore loadingDefault messaggio di risposta. '  + supportMsg,
                        code : 459
                    }
                    callback(ErrorMsg, null);
                }
            }
        },

        // d SVG RECAPTHA VERIFIER!! -----------------------------------------------------------------

        function(callback){
            logConsole.info('UPLOAD@DINAMICO: svgRecaptchaVerifier: start:----------------------------------------------------');

            if(ENV_FORM_CONFIG.NORECAPTCHA) { 
                logConsole.info('@@--WARNING--@@ SVG RECAPTCHA DISABLED!---------------- @@@@@@');
                callback(null, 'svgRecaptchaVerifier DISABLED!');
            } else {

                if (uM.svgVerifyReCaptcha(req.header('RECAPTCHA-TOKEN'), req.header('RECAPTCHA-TOKEN-VAL'))){
                    logConsole.info('UPLOAD@DINAMICO svgRecaptchaVerifier: ok: objFieldSanitized:');
                    logConsole.info(objFieldSanitized);
                    callback(null, 'UPLOAD@DINAMICO:  svgRecaptchaVerifier: success!');
                } else {
                    logConsole.info('UPLOAD@DINAMICO svgRecaptchaVerifier: FALLITO!');
                    ErrorMsg = {
                        title: 'Codici di sicurezza errati (SVG recaptcha)',
                        msg:   'Errore nel codice di verifica. Probabilmente sono state inserite delle cifre diverse da quelle attese nel campo codice di verifica. Riprovare a compilare correttamente il modulo',
                        code: 456
                    };
                    log.error(ID_ISTANZA, reqId);
                    log.error(ID_ISTANZA, ErrorMsg);
                    callback(ErrorMsg, null);
                }
            } 
        },

        
  
        // ##### d PARSING ------------------------------------------------
        function(callback) {
            logConsole.info('UPLOAD@DINAMICO: form parsing: start:----------------------------------------------------------');
        
            var options = {  
                maxFilesSize: ENV_PROT.upload_size,
                autoFiles: true,
                uploadDir: ENV_PROT.upload_dir
            };
        
            logConsole.info('UPLOAD@DINAMICO: form parsing: options:');
            logConsole.info(options);  
            var form = new multiparty.Form(options);

            form.parse(req, 
                function(err, fields, files) {
                    if(err){
                        log.error(ID_ISTANZA, err);
                        ErrorMsg = {
                            title: 'Errore nella validazione dei parametri di input',
                            msg: 'Errore nella decodifica dei dati ricevuti. ' + supportMsg,
                            reqId: reqId,
                            code: 455
                        };
                        callback(ErrorMsg, null);
                    } else {
                        objFieldList = fields;
                        objFilesList = files;
                        logConsole.info('UPLOAD@DINAMICO: form parsing: objFieldList:');
                        logConsole.info(objFieldList);
                        logConsole.info('UPLOAD@DINAMICO: form parsing: objFilesList:');
                        logConsole.info(objFilesList);
                        callback(null, 'UPLOAD: ASYNC form parsing success!');
                    }
                });
        },
 
        // ##### d Input sanitizer & validator------------------------------------------------------------------------

        function(callback){
            logConsole.info('UPLOAD@DINAMICO: sanitizeInput: start:-------------------------------------------------------------');

            if(ENV_FORM_CONFIG.NO_INPUT_DATA_SANITIZE) { 
                logConsole.info('@@--WARNING--@@  SANITIZE_INPUT_DATA_DISABLED!!!!');
                callback(null, '@SANITIZE_INPUT_DATA_DISABLED@');
            } else {

                if (pM.sanitizeInputDinamic(objFieldList, objFieldSanitized, ENV_FORM_CONFIG)){
                    logConsole.info('UPLOAD@DINAMICO sanitizeInput: ok: objFieldSanitized:');
                    logConsole.info(objFieldSanitized);
                    callback(null, 'UPLOAD: ASYNC sanitizeInput: success!');
                } else {
                    ErrorMsg = {
                        title: 'Check input error',
                        msg:   'Errore nei dati di input. ' + supportMsg,
                        code: 456
                    }
                    log.error(ID_ISTANZA, reqId);
                    log.error(ID_ISTANZA, ErrorMsg);
                    callback(ErrorMsg, null);
                }
            } 
        },

        // ##### d FILE Input sanitizer & validator------------------------------------------------------------------------

        function(callback){
            logConsole.info('UPLOAD@DINAMICO sanitizefile: start:-------------------------------------------------------------');

            if(ENV_FORM_CONFIG.NO_FILE_DATA_SANITIZE) { 
                logConsole.info('@@ -- WARINING -- @@ SANITIZE_FILE_DATA_DISABLED!!!!');
                callback(null, '@SANITIZE_FILE_DATA_DISABLED@');
            } else {

                if (pM.sanitizeFile(objFilesList, ENV_FORM_CONFIG)){
                    logConsole.info('UPLOAD@DINAMICO sanitizeFile: ok');
                    callback(null, 'UPLOAD: ASYNC sanitizefile: success!');
                } else {
                    ErrorMsg = {
                        title: 'Check input error',
                        msg:   'Errore nei dati di input. ' + supportMsg,
                        code : 456
                    }
                    log.error(ID_ISTANZA, reqId);
                    log.error(ID_ISTANZA, ErrorMsg);
                    callback(ErrorMsg, null);
                }
            }
        },

        // ########## d Verifica SE NECESSARIA Autenticazione ed imposta valori di protocollazione utente

        function(callback){
            logConsole.info('UPLOAD@DINAMICO checkAuth : start:-------------------------------------------------------------');
            // authEnable

            if(ENV_FORM_CONFIG.authEnable) { 

                logConsole.info('Avvio controllo autenticazione ... ###');
                
                if (!uM.ensureAuthenticatedFun(req)){
                    logConsole.info('Protocollo.js: checkAuth  NOT AUTH TOKEN or EXPIRED!'); 
                    log.error(ID_ISTANZA, 'Protocollo.js:  checkAuth NOT AUTH TOKEN or EXPIRED!');
                    ErrorMsg = {
                            title: 'Errore di autenticazione',
                            msg: 'Probabilmente è passato troppo tempo prima di inviare il modulo. E\' necessario reinviare il modulo',
                            code : 999
                    }
                    callback(ErrorMsg, null);
                } else {
                    logConsole.info('Protocollo.js: checkAuth logged go!');
                    loggedUser = uM.ensureAuthenticatedFun(req);
                    logConsole.info('---loggedUser---');
                    logConsole.info(loggedUser);
                    logConsole.info('---loggedUser---');

                    // impostazione parametri per protocollazione

                    objFieldSanitized[ENV_FORM_CONFIG.mappaFormProtocollo.cognomeRichiedente] = loggedUser.cognome;
                    objFieldSanitized[ENV_FORM_CONFIG.mappaFormProtocollo.nomeRichiedente] = loggedUser.nome;
                    objFieldSanitized[ENV_FORM_CONFIG.mappaFormProtocollo.dataNascitaRichiedente] = loggedUser.dataNascita;

                    // aggiunta valori in 

                    objFieldSanitized.spidUser = loggedUser;
                    callback(null, 'UPLOAD: ASYNC checkAuth: OK!');
                }
                
            } else {
                logConsole.info('Controllo autenticazione DISABILITATO!');
                callback(null, 'UPLOAD: ASYNC checkAuth DISABILITATA!');
            }
        },



        // ##### d Saving files to DISK ------------------------------------------------------------------------

        function(callback){
            logConsole.info('UPLOAD@DINAMICO savingFiles: start: -------------------------------------------------------------');
            if (pM.savingFiles(objFilesList, objFieldSanitized, ENV_FORM_CONFIG )){
                logConsole.info('UPLOAD@DINAMICO savingFiles: ok!');
                callback(null, 'UPLOAD: ASYNC:savingFiles ... ok');
            } else {
                ErrorMsg = {
                    title: 'saving file error',
                    msg: 'Errore nella memorizzazione remota dei files.' + supportMsg,
                    code : 457
                }
                log.error(ID_ISTANZA, reqId);
                log.error(ID_ISTANZA, ErrorMsg);
                callback(ErrorMsg, null);
            }
        },

        // ###### d Build oggetto from template --------------------------------------------------------

        function(callback){
            logConsole.info('UPLOAD@DINAMICO build oggetto: start --------------------------------------------------------');
            var oggetto = pM.buildOggetto(objFieldSanitized, ENV_FORM_CONFIG)
            if (oggetto){
                ENV_FORM_CONFIG.wsJiride.oggettoDocumento = oggetto;
                logConsole.info('UPLOAD@DINAMICO build oggetto: oggetto: del PROTOCOLLO:');
                logConsole.info(oggetto);
                callback(null, 'UPLOAD: ASYNC:oggetto genererato correttamente ... ok');
            }else {
                ErrorMsg = {
                    title: 'saving file error',
                    msg: 'Errore nella creazione oggetto',
                    code : 457
                }
                log.error(ID_ISTANZA, reqId);
                log.error(ID_ISTANZA, ErrorMsg);
                callback(ErrorMsg, null);
            }
        },

        // ##### d Protocollazione ------------------------------------------------------------------------

        function(callback){

            logConsole.info('UPLOAD@DINAMICO protocolloWS: start----------------------------------------------------------------');
                objDatiProtocollo = {};
    
                if(ENV_FORM_CONFIG.NOPROTOCOLLO){ // test
                    logConsole.info('@@ -- WARINING -- @@ PROTOCOLLO DISABLED!!! !!!!');
                    objDatiProtocollo = { InserisciProtocolloEAnagraficheResult:
                    { 
                        IdDocumento: 6658846,
                        AnnoProtocollo: '2018',
                        NumeroProtocollo: 3,
                        DataProtocollo: '01/01/2000',
                        Messaggio: 'Inserimento Protocollo eseguito con successo, senza Avvio Iter',
                        Allegati: { Allegato: {} } 
                    } 
                    };

                    objFieldSanitized.idProtocollo =  objDatiProtocollo.InserisciProtocolloEAnagraficheResult.IdDocumento;
                    objFieldSanitized.annoProtocollo = objDatiProtocollo.InserisciProtocolloEAnagraficheResult.AnnoProtocollo;
                    objFieldSanitized.numeroProtocollo = objDatiProtocollo.InserisciProtocolloEAnagraficheResult.NumeroProtocollo;
                    objFieldSanitized.dataProtocollo = objDatiProtocollo.InserisciProtocolloEAnagraficheResult.DataProtocollo;

                    callback(null, 'protocolloWS ... FAKE!!!!');
                } else {
                        var options = {};
                        options.reqId = reqId;
                        options.idIstanza = ENV_FORM_CONFIG.idIstanza;
                        options.ws_url = ENV_FORM_CONFIG.wsJiride.url;
                        options.ws_endpoint = ENV_FORM_CONFIG.wsJiride.endpoint;
                        
                        
                        options.classificaDocumento = ENV_FORM_CONFIG.wsJiride.classificaDocumento;
                        options.tipoDocumento = ENV_FORM_CONFIG.wsJiride.tipoDocumento;
                        options.oggettoDocumento = ENV_FORM_CONFIG.wsJiride.oggettoDocumento;
                        options.origineDocumento = ENV_FORM_CONFIG.wsJiride.origineDocumento;
                        options.ufficioInternoMittenteDocumento = ENV_FORM_CONFIG.wsJiride.ufficioInternoMittenteDocumento;
                        options.annoPratica = ENV_FORM_CONFIG.wsJiride.annoPratica;
                        options.numeroPratica = ENV_FORM_CONFIG.wsJiride.numeroPratica;
                        options.tipoPersona = ENV_FORM_CONFIG.wsJiride.tipoPersona; 

                        // IMPOSTAZIONE VALORI PER LA PROTOCOLLAZIONE


                        logConsole.info(objFieldSanitized[ENV_FORM_CONFIG.mappaFormProtocollo.cognomeRichiedente]);
                        logConsole.info(objFieldSanitized[ENV_FORM_CONFIG.mappaFormProtocollo.nomeRichiedente]);
                        logConsole.info(objFieldSanitized[ENV_FORM_CONFIG.mappaFormProtocollo.dataNascitaRichiedente]);
                        logConsole.info(objFieldSanitized[ENV_FORM_CONFIG.mappaFormProtocollo.indirizzoRichiedente]);
                        logConsole.info(objFieldSanitized[ENV_FORM_CONFIG.mappaFormProtocollo.cittaRichiedente]);
                        logConsole.info(objFieldSanitized[ENV_FORM_CONFIG.mappaFormProtocollo.emailRichiedente]);
                        
                        // i primi 3 dati sono presi da FEDERA
                        options.cognomeRichiedente = objFieldSanitized[ENV_FORM_CONFIG.mappaFormProtocollo.cognomeRichiedente];
                        options.nomeRichiedente = objFieldSanitized[ENV_FORM_CONFIG.mappaFormProtocollo.nomeRichiedente];
                        options.dataNascitaRichiedente = objFieldSanitized[ENV_FORM_CONFIG.mappaFormProtocollo.dataNascitaRichiedente];

                        options.indirizzoRichiedente = objFieldSanitized[ENV_FORM_CONFIG.mappaFormProtocollo.indirizzoRichiedente];
                        options.cittaRichiedente = objFieldSanitized[ENV_FORM_CONFIG.mappaFormProtocollo.cittaRichiedente];
                        options.emailRichiedente = objFieldSanitized[ENV_FORM_CONFIG.mappaFormProtocollo.emailRichiedente];
                        
                        options.aggiornaAnagrafiche = ENV_FORM_CONFIG.wsJiride.aggiornaAnagrafiche;
                        options.ufficioInternoDestinatarioDocumento = ENV_FORM_CONFIG.wsJiride.ufficioInternoDestinatarioDocumento;
                        options.Utente = ENV_FORM_CONFIG.wsJiride.Utente;
                        options.files = objFieldSanitized.files;
                        options.metadata = true;


                        // pM.protocolloWS(objFieldSanitized, reqId, ENV_FORM_CONFIG, ENV_PROT)
                        pM.protocolloWS_V2(options)
                        .then( function (result) {
                            logConsole.info(result);
                            objDatiProtocollo = result;
                            objFieldSanitized.idProtocollo =  objDatiProtocollo.InserisciProtocolloEAnagraficheResult.IdDocumento;
                            objFieldSanitized.annoProtocollo = objDatiProtocollo.InserisciProtocolloEAnagraficheResult.AnnoProtocollo;
                            objFieldSanitized.numeroProtocollo = objDatiProtocollo.InserisciProtocolloEAnagraficheResult.NumeroProtocollo;
                            objFieldSanitized.dataProtocollo = objDatiProtocollo.InserisciProtocolloEAnagraficheResult.DataProtocollo;
                           
                            var str = moment(objFieldSanitized.dataProtocollo).format("DD/MM/YYYY");
                            logConsole.info('reformat data procotollo', str);
                            objFieldSanitized.dataProtocollo = str;
                            logConsole.info('reformat data procotollo');
                            callback(null, 'protocolloWS ... ok');
                        })
                        .catch(function (err) {
                            // logConsole.info(err);
                            log.error(ID_ISTANZA, 'ASYNC protocolloWS:');
                            log.error(ID_ISTANZA, reqId);
                            log.error(ID_ISTANZA, err);
                            ErrorMsg = {
                                title: 'Errore di protocollo',
                                msg: 'Errore nella protocollazione della richiesta.' + supportMsg,
                                code : 458
                            };
                            callback(ErrorMsg, null);
                        });

                }
        },

          // ###### d SALVA DATI CON PROTOCOLLO ----------------------------------------------------------------

        function(callback){
            logConsole.info('UPLOAD@DINAMICO:salvaDatiConProtocollo:start:-------------------------------------------------------');
            var oggetto = pM.salvaDatiConProtocollo(objFieldSanitized, ENV_FORM_CONFIG);
            if (oggetto){
                logConsole.info('UPLOAD@DINAMICO salvaDatiConProtocollo: ok!');
                callback(null, 'UPLOAD: salvaDatiConProtocollo:messaggio risposta genererato correttamente ... ok');
            } else {
                ErrorMsg = {
                    title: 'saving file error',
                    msg: 'Errore nel salvataggio dati con protocollo',
                    code : 457
                }
                log.error(ID_ISTANZA, reqId);
                log.error(ID_ISTANZA, ErrorMsg);
                callback(ErrorMsg, null);
            }
        },


        // ###### d BUILD Response Message ----------------------------------------------------------------

        function(callback){
            logConsole.info('UPLOAD@DINAMICO build response message: start------------------------------------------------------');
            var oggetto = pM.buildMessaggioRisposta(objFieldSanitized, ENV_FORM_CONFIG);
            if (oggetto){
                logConsole.info('UPLOAD@DINAMICO build response message: ok!');
                ENV_FORM_CONFIG.messaggioRisposta = oggetto;
                callback(null, 'UPLOAD: ASYNC:messaggio risposta genererato correttamente ... ok');
            }else {
                ErrorMsg = {
                    title: 'saving file error',
                    msg: 'Errore nella creazione del messagggio risposta',
                    code : 457
                }
                log.error(ID_ISTANZA, reqId);
                log.error(ID_ISTANZA, ErrorMsg);
                callback(ErrorMsg, null);
            }
        },

        // #### d BUILD Modulo testuale - ricostruisce le informazioni del modulo in maniera testuale campo/valore
        // viene utilizzato per la conferma della ricezione della istanza a video per permetterne la stampa
        
        
        function(callback){
            logConsole.info('UPLOAD@DINAMICO build modulo testuale: start----------------------------------------------------');
            objModelloTestuale = pM.buildRicevuta(objFieldSanitized, ENV_FORM_CONFIG);
            if (objModelloTestuale){
                logConsole.info('UPLOAD@DINAMICO build modulo testuale: ok!');
                callback(null, 'UPLOAD: ASYNC:modulo testuale genererato correttamente ... ok');
            }else {
                ErrorMsg = {
                    title: 'saving file error',
                    msg: 'Errore nella creazione del modulo testuale',
                    code : 457
                }
                log.error(ID_ISTANZA, reqId);
                log.error(ID_ISTANZA, ErrorMsg);
                callback(ErrorMsg, null);
            }
        },
        

        // ###### d BUILD invio mail di conferma ----------------------------------------------------------------
    
        function(callback){
            
            logConsole.info('UPLOAD@DINAMICO invio mail cortesia: start--------------------------------------------------------------');
            if(ENV_FORM_CONFIG.sendEmail) {


                var email2send = objFieldSanitized[ENV_FORM_CONFIG.mappaFormProtocollo.emailRichiedente];
                logConsole.info('UPLOAD@DINAMICO invio mail a: ' + email2send);
                logConsole.info(objFieldSanitized);

                if(email2send && validator.isEmail(email2send)){
                    var templateEmailFileName = ENV_PROT.baseFolder + '/templateXML/' + ENV_FORM_CONFIG.templateEmail;
                    var subjectEmail = pM.buildTemplate(objFieldSanitized, templateEmailFileName);
                    var options = {
                        text:    subjectEmail,
                        from:    ENV_FORM_CONFIG.noreply, 
                        to:      email2send,
                        //cc:      "else <else@your-email.com>",
                        subject: ENV_FORM_CONFIG.messaggioMailTesto + ' (' +  ENV_FORM_CONFIG.idIstanza + ' ' + objFieldSanitized.annoProtocollo + ' ' + objFieldSanitized.numeroProtocollo + ')'
                    }
    
                    if (ENV_FORM_CONFIG.bccDebug) {
                        options.bcc = ENV_FORM_CONFIG.bccDebug;
                    }

                    // SE ESISTE AGGIUNGE LA RICEVUTA PDF ALL'INVIO
                  
                    var dir = ENV_PROT.baseFolder + "/storage/" + ENV_FORM_CONFIG.idIstanza + '/' + objFieldSanitized.reqId;
                    ricevutaFile = dir + "/RICEVUTA-" + objFieldSanitized.reqId + ".pdf";
                    logConsole.info('UPLOAD@DINAMICO invio mail ricevuta: ', ricevutaFile);
                    if (fs.existsSync(ricevutaFile)){
                        options.attachment = [];
                        options.attachment.push({
                            path: ricevutaFile,
                            type:"application/pdf",
                            name: "RICEVUTA-" + objFieldSanitized.reqId + ".pdf"
                        });
                        logConsole.info('UPLOAD@DINAMICO allegata ricevuta!');
                    } else {
                        logConsole.info('UPLOAD@DINAMICO RICEVUTA NON ESISTE!: ', ricevutaFile);
                    }
                     
                    
                    /*
                    attachment: 
                    [
                        {data:"<html>i <i>hope</i> this works!</html>", alternative:true},
                        {path:"path/to/file.zip", type:"application/zip", name:"renamed.zip"}
                    ]
                    */
    
                    serverEmail.send(options, function(err, message) 
                    {
                        if(err) {
                            log.error(ID_ISTANZA, ' UPLOAD:ASYNC ERRORE invio mail ');
                            log.error(ID_ISTANZA, err);  
                        }
                        logConsole.info(ID_ISTANZA+'UPLOAD:ASYNC invio mail OK');
                        callback(null, 'Invio mail preparato ok');
                    });
                } else {
                    logConsole.info('@@---WARNING -- @@ invio mail non valido!');
                    callback(null, 'Invio mail non valido!');
                }
                
            } else {
                logConsole.info('@@---WARNING -- @@ invio mail NON ABILITATO!');
                callback(null, 'Invio mail canceled!');
            }
        },

        // d CARICAMENTO MODULO FUNZIONI AGGIUNTIVE ------------------------------------
        // d Ogni form può richiedere un modulo aggiuntive di funzionalià
        function(callback){
            logConsole.info('UPLOAD@DINAMICO check extensions: start');
                var fExtensionName =  '../extensions/' + req.params.formId + '.js';
                
                logConsole.info('UPLOAD@DINAMICO extensions loadingDefault : load default data : ' + fExtensionName);
         
                try {
                    var EXTENSION_MODULE = require(fExtensionName);
                    EXTENSION_MODULE.execute(objFieldSanitized, reqId, ENV_FORM_CONFIG, ENV_PROT)
                    .then(function(result) {
                        logConsole.info(result);
                        callback(null, 'MODULE EXTENSION ... ok');
                    })
                    .catch(function (err) {
                        logConsole.info(err);
                        callback('MODULE EXTENSION ERROR', null);    
                    });
                }
                catch (e) {
                    logConsole.info(ID_ISTANZA+'NESSUN MODULO AGGIUNTIVO TROVATO : ' + fExtensionName);
                    callback(null, ID_ISTANZA+ 'NESSUN MODULO AGGIUNTIVO');
                }
        },

        // g Cifra i dati caricati e cancella gli originali
        function gdpr(callback){
            logConsole.info('UPLOAD@DINAMICO check gdpr: start');
            var oggetto = pM.gdpr(objFieldSanitized, ENV_FORM_CONFIG);
            if (oggetto){
                logConsole.info('UPLOAD@DINAMICO gdpr: ok!');
                callback(null, 'UPLOAD: gdpr:messaggio risposta genererato correttamente ... ok');
            } else {
                ErrorMsg = {
                    title: 'saving file error',
                    msg: 'Errore nel salvataggio dati con protocollo',
                    code : 457
                }
                log.error(ID_ISTANZA, reqId);
                log.error(ID_ISTANZA, ErrorMsg);
                callback(ErrorMsg, null);
            }

        }

    ],function(err, results) {
        // results is now equal to: {one: 1, two: 2}
        logConsole.info(ID_ISTANZA+' UPLOAD DINAMICO: ESITO FINALE:');
        if(err){
            logConsole.info(ID_ISTANZA+' UPLOAD DINAMICO: ERRORI:');
            err.reqId = reqId;
            err.loggedUser = loggedUser;
            ErrorMsg.reqId = reqId;
            log.error(ID_ISTANZA, err);
            logConsole.info(ID_ISTANZA, err);
            
            res.status(ErrorMsg.code).send(ErrorMsg);
        } else {
            logConsole.info(ID_ISTANZA+' UPLOAD DINAMICO: SUCCESSO!');
            // results.msg = htmlResponseMsg;
            // logConsole.info(htmlResponseMsg);
        
            var Msg = {
                    "documentId" : ENV_FORM_CONFIG.idIstanza,
                    "actionId": "ISTANZA_INVIATA",
                    "title": "Istanza ricevuta con successo!",
                    "idIstanza": ENV_FORM_CONFIG.idIstanza,
                    "msg": objModelloTestuale,
                    "txtMsg": ENV_FORM_CONFIG.messaggioRisposta,
                    "htmlMsg": objFieldSanitized,
                    "reqId": reqId,
                    code : 200
            }
            
            // logEmail.info(Msg);
            // logElastic.info(Msg);
            var infoIstanza = { 
                reqId: reqId,
                annoProtocollo: objFieldSanitized.annoProtocollo,
                numeroProtocollo: objFieldSanitized.numeroProtocollo,
                dataProtocollo: objFieldSanitized.dataProtocollo,
                loggedUser: loggedUser
            };

            log.info(ID_ISTANZA + ' ISTANZA PROTOCOLLATA: ', infoIstanza);
            logConsole.info(ID_ISTANZA + ' ISTANZA PROTOCOLLATA: ', infoIstanza);
            
            res.status(200).send(Msg);
        }
    });

 

});


  return router;
}
