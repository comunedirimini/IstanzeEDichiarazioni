/* protocollo module*/
/* contiene tutte le funzioni di utilitù per il route protocollo.js*/
var ENV = require('../config/configPROTOCOLLO.js'); // load configuration data
var validator = require('validator');
var fs = require('fs');
var fsExtra = require('fs-extra');
var spark = require('spark-md5');
var md5File = require('md5-file');
var moment = require('moment');
var mime = require('mime');
var utilityModule  = require('../models/utilityModule.js'); 
var reportModule  = require('../models/reportModule.js'); 
var soap = require('soap');
var handlebars = require('handlebars');


var log = require('log4js').getLogger("app");
log.debug('START protocolloModule.js');

exports.verificaReCaptcha = function(fieldsObj, envData){
    console.log('[' + envData.idIstanza + '] protocolloModule.js:verificaReCaptcha');
    var fileContents = '';
    var templateFileName = envData.templateOggetto;

    try {
        fileContents = fs.readFileSync(templateFileName).toString();
    } 
    catch (err) 
    {
        log.error('[' + envData.idIstanza + '] protocolloModule.js:verificaReCaptcha');
        log.error(err);
        return false;
    }
    var template = handlebars.compile(fileContents);
    htmlResponseMsg = template(fieldsObj);
    console.log(htmlResponseMsg);
    return htmlResponseMsg;
}


// esegue un template generico dato il file ed i dati
exports.buildTemplate = function(fieldsObj, templateFileName){
    console.log('protocolloModule.js:buildTemplate:', templateFileName);

    try {
        fileContents = fs.readFileSync(templateFileName).toString();
    } 
    catch (err) 
    {
        log.error('protocolloModule.js:buildTemplate');
        log.error(err);
        return false;
    }

    var template = handlebars.compile(fileContents);
    htmlResponseMsg = template(fieldsObj);
    console.log(htmlResponseMsg);
    return htmlResponseMsg;
}


exports.buildOggetto = function(fieldsObj, envData){
    console.log('[' + envData.idIstanza + '] protocolloModule.js:buildOggetto');
    var fileContents = '';
    var templateFileName = ENV.baseFolder + '/templateXML/' + envData.templateOggetto;

    console.log('[' + envData.idIstanza + '] protocolloModule.js:buildOggetto:',templateFileName);
    try {
        fileContents = fs.readFileSync(templateFileName).toString();
    } 
    catch (err) 
    {
        log.error('[' + envData.idIstanza + '] protocolloModule.js:buildOggetto');
        log.error(err);
        return false;
    }
    var template = handlebars.compile(fileContents);
    htmlResponseMsg = template(fieldsObj);
    console.log(htmlResponseMsg);
    return htmlResponseMsg;
}

exports.buildMessaggioRisposta = function(fieldsObj, envData){
    var fileContents = '';
    var templateFileName = ENV.baseFolder + '/templateXML/' + envData.templateRisposta;
    console.log('[' + envData.idIstanza + '] protocolloModule.js:buildMessaggioRisposta:', templateFileName);
    try {
        fileContents = fs.readFileSync(templateFileName).toString();
    } 
    catch (err) 
    {
        log.error('[' + envData.idIstanza + '] protocolloModule.js:buildOggetto');
        log.error(err);
        return false;
    }
    var template = handlebars.compile(fileContents);
    htmlResponseMsg = template(fieldsObj);
    console.log(htmlResponseMsg);
    return htmlResponseMsg;
}


// crea un oggetto array di coppie descrizione valore per costruire la ricevuta

exports.buildRicevuta = function(fieldsObj, envData){
   
    console.log('[' + envData.idIstanza + '] protocolloModule.js:buildRicevuta:');
    console.log(fieldsObj);
    console.log(envData);

    var listaOggetti = [];

    // se abilitata l'autenticazione esiste l'oggetto loggedUser
    if(envData.authEnable) {
        listaOggetti.push({desc: "Nome del dichiarante" , value: fieldsObj.spidUser.nome , prop: 'spidNome' });
        listaOggetti.push({desc: "Cognome del dichiarante" , value: fieldsObj.spidUser.cognome, prop: 'spidCognome' });
        listaOggetti.push({desc: "Codice fiscale del dichiarante" , value: fieldsObj.spidUser.codiceFiscale, prop: 'spidCodiceFiscale' });
        listaOggetti.push({desc: "Data di nascita del dichiarante" , value: fieldsObj.spidUser.dataNascita, prop: 'spidDataNascita' });
    }

    // aggiunge in testa i dati di protocollazione
    listaOggetti.push({desc: "Anno Protocollo" , value: fieldsObj.annoProtocollo, prop: 'annoProtocollo' });
    listaOggetti.push({desc: "Numero Protocollo" , value: fieldsObj.numeroProtocollo, prop: 'numeroProtocollo' });
    listaOggetti.push({desc: "Data Protocollo" , value: fieldsObj.dataProtocollo, prop: 'dataProtocollo' });
    listaOggetti.push({desc: "Identificativo richiesta" , value: fieldsObj.reqId, prop: 'reqId' });
    listaOggetti.push({desc: "Codice di risposta alla richiesta di sicurezza" , value: fieldsObj.svgCaptchaResponse, prop: 'svgCaptchaResponse' });
  

    Object.keys(fieldsObj).forEach(function(name) {
        console.log('ricerca:', name, fieldsObj[name]);
        var item = envData.vm_fields.find(x => x.key === name);
        var objItem = {};
        if(item) {
            
            switch (item.type) {
                case 'input':
                    objItem.desc = item.templateOptions.label;
                    objItem.value = fieldsObj[name];
                    objItem.prop = name;
                    listaOggetti.push(objItem);
                    console.log('addToList:',objItem);
                    break;
                case 'select':
                    objItem.desc = item.templateOptions.label;
                    objItem.value = fieldsObj[name];
                    objItem.prop = name;
                    listaOggetti.push(objItem);
                    console.log('addToList:',objItem);
                    break;
                case 'radio':
                    objItem.desc = item.templateOptions.label;
                    objItem.value = fieldsObj[name];
                    objItem.prop = name;
                    listaOggetti.push(objItem);
                    console.log('addToList:',objItem);
                    break;
                case 'checkbox':
                    objItem.desc = item.templateOptions.label;
                    objItem.value = "SI";
                    objItem.prop = name;
                    listaOggetti.push(objItem);
                    console.log('addToList:',objItem);
                    break;
                default: 
                    console.log('>>>>>>>>>item not in switch:',item);
                break;
            }

        } else {
              console.log('ERRORE key not found :', name);
        }
     });
    
     if(fieldsObj.files){
        var objItem = {};
        objItem.desc = "Documenti allegati";
        objItem.prop = 'files';
        objItem.value = JSON.stringify(fieldsObj.files);
        listaOggetti.push(objItem);
    }

    // salvataggio ricevuta

    console.log('[' + envData.idIstanza + '] protocolloModule:buildRicevuta');
    var dir = ENV.baseFolder + "/storage/" + envData.idIstanza + '/' + envData.reqId;
    console.log('[' + envData.idIstanza + '] protocolloModule:storageFolder:' + dir);

    // prepara tutti i dati per la ricevuta TXT e video
    console.log(listaOggetti);
    var ricevutaFile = dir + "/RICEVUTA-" + envData.reqId + ".txt";
    console.log('[' + envData.idIstanza + '] protocolloModule:storageFolder:ricevutaTxt' + ricevutaFile);
    fs.writeFileSync(ricevutaFile, JSON.stringify( listaOggetti, null, 4 ));
   

    // prepara la ricevuta in pdf ...
    /*
    obj.logoRicevuta_width = 500;
    obj.logoRicevuta_height = 80;
    obj.intestazione = 'Comune di Rimini - Ufficio Diritto allo studio - Ricevuta di inoltro istanza';
    obj.descrizione = 'RICHIESTA DI ADESIONE AL "PROGETTO CONCILIAZIONE VITA-LAVORO" PER SOGGETTI GESTORI DI CENTRI ESTIVI';
    obj.annoProtocollo = item1.value;
    obj.numeroProtocollo = item2.value;
    obj.dataProtocollo = item3.value;
    obj.reqId = item2.value;
    */

    // console.log(obj);
    var objH = {}
    objH.intestazione = envData.ricevutaIntestazione;
    objH.descrizione = envData.ricevutaDescrizione;

    objH.logoRicevuta = envData.ricevutaLogo;
    objH.logoRicevuta_width = envData.ricevutaLogoW;
    objH.logoRicevuta_height = envData.ricevutaLogH;

    objH.annoProtocollo = fieldsObj.annoProtocollo;
    objH.numeroProtocollo = fieldsObj.numeroProtocollo;
    objH.dataProtocollo = fieldsObj.dataProtocollo;
    objH.reqId = fieldsObj.reqId;
    objH.idIstanza = envData.idIstanza;

    
    // SALVA IL PDF !!!!
    ricevutaFile = dir + "/RICEVUTA-" + envData.reqId + ".pdf";
    console.log('[' + envData.idIstanza + '] protocolloModule:storageFolder:ricevutaPdf' + ricevutaFile);
    reportModule.buildRicevuta(listaOggetti, objH, ricevutaFile);

    
    return listaOggetti;
}


exports.sanitizeFile = function (fileList, envData) {
    console.log('[' + envData.idIstanza + '] protocolloModule:sanitizeFile');
    var bValid = true;
    var msgValidator = '';


    console.log('---------- fileList -----------------------------------------------------------');
    console.log(fileList);

   
    // controlla se esiste la richiesta di un file con quel tag nel modulo di INPUT ù
    // e ne controlla la dimensione

    
    Object.keys(fileList).forEach(function(name) {
        console.log('protocolloModule:sanitizeFile:name:', name);
        
        // controlla se in struttura esiste la richiesta di un nome file con il name indicato
        var regExp = /\[(.*?)\]/g;
        var fileId = name.match(regExp);
        var fileKey = '';

        if(fileId) {
            var fileKey = fileId[0];
            fileKey = fileKey.substring(0, fileKey.length - 1);
            fileKey = fileKey.substring(1, fileKey.length);
        } else {
            bValid = false;  msgValidator = 'file upload name parsing error';
        }

        console.log('protocolloModule:sanitizeFile:ricerca key:', fileKey);

        var maxFileSize = '';
        var fileToUpload = envData.vm_fields.find(x => x.key === fileKey);
        if (fileToUpload) {
          console.log(fileToUpload);
          console.log(fileToUpload.templateOptions.maxFileSize);
          maxFileSize = fileToUpload.templateOptions.maxFileSize;
        } else {
            bValid = false;  msgValidator = 'file upload key not found';
        }


        console.log(fileList[name][0].size, maxFileSize) ;
        var maxFileSizeNumber = 0;

        if (maxFileSize !== ''){
            var maxFileSizeNumber = parseInt(maxFileSize.substring(0, maxFileSize.length- 2)) * 1024 * 1024;
        } else {
            bValid = false;  msgValidator = 'dimensione degli allegati supera il limite';
        }
        // controlla se la dimensione è corretta
        

        if (parseInt(fileList[name][0].size) > maxFileSizeNumber) {
            log.error('[' + envData.idIstanza + '] protocolloModule:sanitizeFile:numero allegati non corretto!');
            bValid = false;  msgValidator = 'dimensione degli allegati supera il limite';
        } else {
            console.log('dimensione file corretta:', fileList[name][0].size, maxFileSizeNumber);
        }
    });

    if ( bValid ) {
        return true;
    } else {
        log.error('[' + envData.idIstanza + '] protocolloModule:sanitizeFile');
        log.error(msgValidator);
        return false;
    }
}


/*
    Esegue un controllo sulla esistenza e sul valore dei parametri passati
    e crea fieldsObj
*/

exports.sanitizeInput = function (fieldList, fieldsObj,  envData) {
    
    console.log('[' + envData.idIstanza + '] protocolloModule:sanitizeInput');
    console.log('---------- fieldList -----------------------------------------------------------');
    console.log(fieldList);

    fieldsObj.reqId = envData.reqId;

    Object.keys(fieldList).forEach(function(name) {
        console.log('protocolloModule:sanitizeInput:got field named ' + name);

        switch(name) {
            case 'fields[nomeRichiedente]':
                fieldsObj.nomeRichiedente = fieldList[name][0];
                break;
            case 'fields[cognomeRichiedente]':
                fieldsObj.cognomeRichiedente = fieldList[name][0];
                break;
            case 'fields[emailRichiedente]':
                fieldsObj.emailRichiedente = fieldList[name][0];
                break;
            case 'fields[codiceFiscaleRichiedente]':
                fieldsObj.codiceFiscaleRichiedente = fieldList[name][0];
                break;
            case 'fields[recapitoTelefonicoRichiedente]':
                fieldsObj.recapitoTelefonicoRichiedente = fieldList[name][0];
                break;
            case 'fields[dataNascitaRichiedente]':
                fieldsObj.dataNascitaRichiedente = fieldList[name][0];
                break;                
            case 'fields[indirizzoRichiedente]':
                fieldsObj.indirizzoRichiedente = fieldList[name][0];
                break;
            case 'fields[cittaRichiedente]':
                fieldsObj.cittaRichiedente = fieldList[name][0];
                break;
            case 'fields[capRichiedente]':
                fieldsObj.capRichiedente = fieldList[name][0];
                break;
            case 'fields[oggettoRichiedente]':
                fieldsObj.oggettoRichiedente = fieldList[name][0];
                break;
            default:
                break;
        }

    });

    // validate object
    // https://www.npmjs.com/package/validator

    console.log('---------- fieldsObj -----------------------------------------------------------');
    console.log(fieldsObj);
    console.log('protocolloModule:validate data ...');
    var bValid = true;
    var msgValidator = '';

    /* validazione esistenza */

    if( !fieldsObj.nomeRichiedente){    bValid = false;  msgValidator = 'nomeRichiedente richiesto'; }
    if( !fieldsObj.cognomeRichiedente){ bValid = false;  msgValidator = 'cognomeRichiedente richiesto'; }
    if( !fieldsObj.codiceFiscaleRichiedente){ bValid = false;  msgValidator = 'codiceFiscaleRichiedente richiesto'; }
    if( !fieldsObj.dataNascitaRichiedente) { bValid = false;  msgValidator = 'dataNascitaRichiedente richiesto'; }
    if( !fieldsObj.indirizzoRichiedente){ bValid = false;  msgValidator = 'indirizzoRichiedente richiesto'; }
    if( !fieldsObj.cittaRichiedente){ bValid = false;  msgValidator = 'cittaRichiedente richiesto'; }
    if( !fieldsObj.capRichiedente) { bValid = false;  msgValidator = 'capRichiedente richiesto'; }
    if( !fieldsObj.emailRichiedente){ bValid = false;  msgValidator = 'emailRichiedente richiesto'; }
    if( !fieldsObj.recapitoTelefonicoRichiedente){ bValid = false;  msgValidator = 'recapitoTelefonicoRichiedente richiesto'; }
    
    /* validazione dimensioni */

    if( fieldsObj.nomeRichiedente.length > 80 ){
        console.log(fieldsObj.nomeRichiedente.length);
        bValid = false;
        msgValidator = 'nomeRichiedente troppo lungo';
    }

    if( fieldsObj.cognomeRichiedente.length > 80 ){
        console.log(fieldsObj.cognomeRichiedente.length);
        bValid = false;
        msgValidator = 'cognomeRichiedente troppo lungo';
    }

    if( fieldsObj.codiceFiscaleRichiedente.length != 16){
        console.log(fieldsObj.codiceFiscaleRichiedente.length);
        bValid = false;
        msgValidator = 'Codice fiscale non valido';
    }

    if( fieldsObj.indirizzoRichiedente.length > 80 ){
        console.log(fieldsObj.indirizzoRichiedente.length);
        bValid = false;
        msgValidator = 'indirizzoRichiedente troppo lungo';
    }

    if( fieldsObj.cittaRichiedente.length > 80 ){
        console.log(fieldsObj.cittaRichiedente.length);
        bValid = false;
        msgValidator = 'cittaRichiedente troppo lungo';
    }

    if( fieldsObj.capRichiedente.length > 80 ){
        console.log(fieldsObj.capRichiedente.length);
        bValid = false;
        msgValidator = 'capRichiedente troppo lungo';
    }

    if( fieldsObj.emailRichiedente.length > 80 ){
        console.log(fieldsObj.emailRichiedente.length);
        bValid = false;
        msgValidator = 'emailRichiedente troppo lungo';
    }

    if( fieldsObj.recapitoTelefonicoRichiedente.length > 80 ){
        console.log(fieldsObj.recapitoTelefonicoRichiedente.length);
        bValid = false;
        msgValidator = 'recapitoTelefonicoRichiedente troppo lungo';
    }

    if(fieldsObj.noteRichiedente){
        if( fieldsObj.noteRichiedente.length > 80 ){
            console.log(fieldsObj.noteRichiedente.length);
            bValid = false;
            msgValidator = 'noteRichiedente troppo lungo';
        }
    }

    /*

    if( fieldsObj.oggettoRichiedente && (fieldsObj.oggettoRichiedente.length > 300) ){
        bValid = false;
        msgValidator = 'Oggetto troppo lungo';
    }

    */

    /* validazione di tipo */
    
    if( !validator.isEmail(fieldsObj.emailRichiedente) ){
        bValid = false;
        msgValidator = 'Email non valida';
    }
   
    if( !validator.isDecimal(fieldsObj.recapitoTelefonicoRichiedente)){
        bValid = false;
        msgValidator = 'recapitoTelefonicoRichiedente non valido';
    }

    if( !validator.isDecimal(fieldsObj.capRichiedente) ){
        bValid = false;
        msgValidator = 'capRichiedente non valido';
    }

    console.log(fieldsObj.dataNascitaRichiedente);
    if( !moment( fieldsObj.dataNascitaRichiedente, 'DD/MM/YYYY', true).isValid()){
        bValid = false;
        msgValidator = 'Data di Nascita non valida';
    } 

    if ( bValid ) {
        return true;
    } else {
        msgValidator = '[' + envData.idIstanza + '] '+ msgValidator;
        log.error('[' + envData.idIstanza + '] protocolloModule:sanitizeInput');
        log.error(msgValidator);
        return false;
    }
     
}

/* Controllo dei dati di input per il form dinamico  */

exports.sanitizeInputDinamic = function (fieldList, fieldsObj,  envData) {
    
    console.log('[' + envData.idIstanza + '] protocolloModule:sanitizeInputDinamic');
    console.log('---------- fieldList -----------------------------------------------------------');
    console.log(fieldList);

    var bValid = true; // variabile per la verifica
    var msgValidator = ''; // eventuale messaggio di errore

    

    Object.keys(fieldList).forEach(function(name) {
        console.log('protocolloModule:sanitizeInputDinamic:got field named ' + name);

        var r = /\[(.*?)\]/;
        var rs = name.match(r);
        key = rs[1];
  
        console.log('protocolloModule:sanitizeInputDinamic:key ' + key);
      
        fieldsObj[key] = fieldList[name][0];

    });

    // preparato filedsObj che contiene il JSON con tutti i campi
    // la validazione è inclusiva nel senso che il form può essere un sottoinsieme dei dati richiesti a secondo della 
    // dinamica del form che nasconde o meno delle parti
    // si ricerca in .vm_fields se esiste la key e si procede alla validazione
    // console.log(envData.vm_fields);

    Object.keys(fieldsObj).forEach(function(name) {
        // console.log(name, fieldsObj[name]);
        var item = envData.vm_fields.find(x => x.key === name);

        if(item) {
            console.log('## CHECK :', name, item.templateOptions.type, fieldsObj[name]);

            if(fieldsObj[name] == '' || fieldsObj[name] == 'null') {

                console.log('## CHECK SKIP VOID VALUE :', name, fieldsObj[name]);

            } else {

                if(!item.templateOptions.type)  {
                    console.log('## CHECK TYPE NOT DEFINED SET TEXT');
                    item.templateOptions.type = 'text';
                }
    
                if (item.templateOptions.type == 'text'){
                    // console.log(item.templateOptions.maxlength);
                    var checkMaxlength = 255;
                    if (item.templateOptions.maxlength) checkMaxlength = item.templateOptions.maxlength;
                    // console.log(checkMaxlength);
                    if(fieldsObj[name].length > checkMaxlength) {
                        console.log('## CHECK SIZE ERROR :', name, fieldsObj[name].length, checkMaxlength);
                        bValid = false;  msgValidator = 'Errore nella validazione del campo ' + name;
                    } else {
                        console.log('## CHECK SIZE OK:', name, fieldsObj[name].length, checkMaxlength);
                    }
                }
    
                if (item.templateOptions.type == 'number'){
                    console.log('## CHECK item number: ',name );
                    if (validator.isNumeric(fieldsObj[name])){
                        console.log('## CHECK NUMBER ok for:', name, fieldsObj[name]);
                    } else {
                        console.log('## CHECK item number ERROR for:', name, fieldsObj[name]);
                        bValid = false;  msgValidator = 'Errore nella validazione del campo ' + name;
                    }
    
                    if(item.templateOptions.max) {
                        if(fieldsObj[name] > item.templateOptions.max) {
                            console.log('## CHECK item number MAX ERROR for:', name, fieldsObj[name]);
                            bValid = false;  msgValidator = 'Errore nella validazione del campo ' + name;
                        } else {
                            console.log('## CHECK item number MAX ok for :', name, fieldsObj[name], item.templateOptions.max);
                        }
                    }
                }
    
    
                if(item.validators) {
                    console.log('## CHECK validators ... ');
                    Object.keys(item.validators).forEach(function(validatorId){
                        console.log('## CHECK validatorId: ', validatorId);
                        console.log('## CHECK run validator with value: ', fieldsObj[name]);
                        console.log('## CHECK validator return value ', item.validators[validatorId].expression(fieldsObj[name]));
                        // raise error
                        if(!item.validators[validatorId].expression(fieldsObj[name])) {
                            bValid = false;  msgValidator = 'Errore nella validazione del campo ' + name;
                        }
                    });      
                }

            }
          
        } else {
          log.error('ERRORE key not found :', name);
          bValid = false;  msgValidator = 'Errore key non trovata! ' + name;
        }
    });


    // validate object
    // https://www.npmjs.com/package/validator

    console.log('---------- fieldsObj -----------------------------------------------------------');
    fieldsObj.reqId = envData.reqId;
    console.log(fieldsObj);



    if ( bValid ) {
        return true;
    } else {
        msgValidator = '[' + envData.idIstanza + '] '+ msgValidator;
        log.error('[' + envData.idIstanza + '] protocolloModule:sanitizeInputDinamic');
        log.error(msgValidator);
        return false;
    }
}

/* SALVA NELLA CARTELLA TEMPORANEA I DATI DI INPUT CON IL PROTOCOLLO */

exports.salvaDatiConProtocollo = function (fieldsObj, envData) {
    console.log('[' + envData.idIstanza + '] protocolloModule:salvaDatiConProtocollo');
    var dir = ENV.baseFolder + "/storage/" + envData.idIstanza + '/' + envData.reqId;
    console.log('[' + envData.idIstanza + '] protocolloModule:storageFolder:' + dir);

    try{
        // throw "TEST - File NOT FOUND Exception";
        if (!fs.existsSync(dir)){
            try
            { 
                fs.mkdirSync(dir);
                console.log('protocolloModule:Folder OK' + dir);
            }
            catch(e) {
                log.error('[' + envData.idIstanza + '] protocolloModule:salvaDatiConProtocollo: create folder ERROR');
                log.error(e);
            }
        }
        console.log('protocolloModule:' + dir);
        
        // save metadata metadati
        var jsonFile = dir + "/PROTOCOLLO-" + envData.reqId + ".txt";
        console.log(jsonFile);
        fs.writeFileSync(jsonFile, JSON.stringify(fieldsObj));


        // prepara tutti i dati per la ricevuta va visualizzare a video e salvare come pdf
        // var jsonFile = dir + "/RICEVUTA-" + envData.reqId + ".txt";
        // var ricevutaContent = this.buildModuloTestuale(fieldsObj, envData);
        // console.log(ricevutaContent);
        // fs.writeFileSync(ricevutaContent, JSON.stringify( fieldsObj, null, 4 ));
        
        // salva i dati come ricevuta

        return true;

    } catch (e){
        log.error('[' + envData.idIstanza + '] savingFiles: ERROR');
        log.error(e);
        return false;
    }

}

/* CIFRA I DATI SALVATI con password */

exports.gdpr = function (fieldsObj, envData) {
    console.log('[' + envData.idIstanza + '] protocolloModule:gdpr');
    console.log('[' + envData.idIstanza + '] protocolloModule:gdpr:' + envData.reqId);
    var dir = ENV.baseFolder + "/storage/" + envData.idIstanza + '/' + envData.reqId;
    console.log('[' + envData.idIstanza + '] protocolloModule:gdpr:' + dir);
    
    try{
        // controlla l'esistenza della cartella
        if (!fs.existsSync(dir)){
            log.error('[' + envData.idIstanza + '] protocolloModule:gdpr: folder not exist!');
            log.error(e);
        } else {
            // per ogni file viene generato il file cifrato 
            fs.readdirSync(dir).forEach(file => {
                var fName = dir + "/" + file;
                console.log('protocolloModule:cypher:', fName);
                utilityModule.encryptFile({ file: fName, password: envData.reqId });
            });

            // ogni file non enc viene eliminato
            fs.readdirSync(dir).forEach(file => {
                var fName = dir + "/" + file;
                if (fName.substr(fName.length - 3) == 'enc') {
                    console.log('protocolloModule:skip:', fName);
                } else {
                    console.log('protocolloModule:delete DISABLED!:', fName);
                    // DISABILITATO !!!! fs.unlinkSync(fName);
                }
            });
        }
        return true;

    } catch (e){
        log.error('[' + envData.idIstanza + '] gdpr: ERROR');
        log.error(e);
        return false;
    }

}


/* OUTPUT VERSO UN CSV O DB dei dati protocollati 

exports.output2FileDatabase = function (fieldsObj, envData) {
    console.log('[' + envData.idIstanza + '] protocolloModule:output2FileDatabase');
    console.log('[' + envData.idIstanza + '] protocolloModule:storageFolder:' + envData.storageFolder);
    var dir = envData.storageFolder + "/" + envData.reqId;

    if (envData.outputData2CSV){
        try{
            console.log('[' + envData.idIstanza + '] write to: ', envData.outputData2CSV.filename);
            console.log('[' + envData.idIstanza + '] template to: ', envData.outputData2CSV.template);
            var templateFileName = envData.outputData2CSV.template;

            fileContents = fs.readFileSync(templateFileName).toString();
                        
            var template = handlebars.compile(fileContents);
            outputLine = template(fieldsObj) + "\n";
            console.log(outputLine);
            fs.appendFileSync(envData.outputData2CSV.filename, outputLine);
            return true;
        }
        catch (e){
            log.error('[' + envData.idIstanza + '] protocolloModule.js:output2FileDatabase:template: ERROR');
            log.error(e);
            return false;
        }
    }

}
*/


/* SAVING FILES  

    salva i file dell'upload nella cartella temporanea

--------------------------------------------------------------------------------------------------------- */

exports.savingFiles = function (fileList, fieldsObj, envData) {
    console.log('[' + envData.idIstanza + '] protocolloModule:savingFiles');
    console.log('[' + envData.idIstanza + '] protocolloModule:baseFolder:' + ENV.baseFolder);
    // var transactionId = req.body.fields.transactionId;
    var dir = ENV.baseFolder + "/storage/" + envData.idIstanza + "/" + envData.reqId;

    console.log('protocolloModule:storageFolder:' + dir);
    fieldsObj.files = [];

    console.log('---------- fileList -----------------------------------------------------------');
    console.log(fileList);


    try{
        // throw "TEST - File NOT FOUND Exception";
        if (!fs.existsSync(dir)){
            try
            { 
                fs.mkdirSync(dir);
                console.log('protocolloModule:Folder created!: ' + dir);
            }
            catch(e) {
                log.error('[' + envData.idIstanza + '] protocolloModule:storageFolder: create folder ERROR');
                log.error(e);
            }
        }
        console.log('protocolloModule: ' + dir);
        console.log('protocolloModule:filelist.lenght: ' + fileList.length);

        Object.keys(fileList).forEach(function(name) {
            console.log('protocolloModule:save: ' + name);

            var originalFilename = fileList[name][0].originalFilename;
            var destFile = dir + "/" + fileList[name][0].originalFilename;
            var sourceFile = fileList[name][0].path;
            console.log(sourceFile);
            console.log(destFile);
            //fs.renameSync(sourceFile, destFile);
            // fs.createReadStream(sourceFile).pipe(fs.createWriteStream(destFile));
            //fs.copySync(path.resolve(__dirname,'./init/xxx.json'), 'xxx.json');
            fsExtra.copySync(sourceFile, destFile);
            var hash2 = md5File.sync(destFile);
            console.log('protocolloModule:dest:' + destFile);
            console.log('protocolloModule:hash2:'+ hash2);

            fieldsObj.files.push({ 'name' : originalFilename});
        });

        // save metadata metadati
        var jsonFile = dir + "/" + envData.reqId + ".txt";
        console.log(jsonFile);
        fs.writeFileSync(jsonFile, JSON.stringify(fieldsObj));
        console.log(fieldsObj);

        return true;

    } catch (e){
        log.error('[' + envData.idIstanza + '] savingFiles: ERROR');
        log.error(e);
        log.error(userObj);
        return false;
    }
}


exports.info = function(data) {

    // console.log(typeof(data));
    // console.log(typeof(arguments));
    // console.log(arguments.length);
    if (arguments.length == 1) {
        //logger.log('info', arguments[0]);
        // console.log(typeof(arguments[0]))
        if (typeof(arguments[0]) == 'object')  {
            // console.log('object');
            logger.log('info', JSON.stringify(arguments[0], null, 4));
            //listArgs = listArgs + ' ' + JSON.stringify(arguments[0]);
        } else {
            // console.log('other');
            logger.log('info', arguments[0]);
        }
    
    } else {
        var listArgs = "";
        for (var i = 0; i < arguments.length; i++) {
            // console.log(typeof(arguments[i]));
            if (typeof(arguments[i] == 'object'))  {
                listArgs = listArgs + ' ' + JSON.stringify(arguments[i]);
            } else {
                listArgs = listArgs + ' ' + arguments[i];
            }
        }
        logger.log('info',listArgs);    
    }

    /*
    
    if (arguments.length == 1) {
        logger.log({ level: 'info', message: arguments[0] });    
    } else {
        logger.log({ level: 'info', message: listArgs });    
    }
    */
    
    // logger.log("info", "Starting up with config %j", listArgs);
}

exports.error = function(data) {
    if (arguments.length == 1) {
        if (typeof(arguments[0]) == 'object')  {
            logger.log('error', JSON.stringify(arguments[0], null, 4));
        } else {
            logger.log('error', arguments[0]);
        }
    
    } else {
        var listArgs = "";
        for (var i = 0; i < arguments.length; i++) {
            // console.log(typeof(arguments[i]));
            if (typeof(arguments[i] == 'object'))  {
                listArgs = listArgs + ' ' + JSON.stringify(arguments[i], null, 4);
            } else {
                listArgs = listArgs + ' ' + arguments[i];
            }
        }
        logger.log('error',listArgs);    
    }
}

exports.log2email = function(data){
    console.log('########## LOG 2 EMAIL TO TO TO TO ');
}


/****
exports.protocolloWS = function(objFilesList,  reqId, ENV_DATA, ENV_PROT) {

    console.log('[' + ENV_DATA.idIstanza + '] --------- protocolloWS ----------------------------');    
    console.log('[' + ENV_DATA.idIstanza + '] protocolloModule:protocolloWS:START');
    console.log(objFilesList);
    console.log(reqId);
    
    
    console.log(ENV_DATA.wsJiride);

    WS_IRIDE = ENV_DATA.wsJiride.url;
    WS_IRIDE_ENDPOINT = ENV_DATA.wsJiride.endpoint;

    console.log('[' + ENV_DATA.idIstanza + '] protocolloModule:protocolloWS:Endpoint');
    console.log(WS_IRIDE);
    console.log(WS_IRIDE_ENDPOINT);

    // formattazione data per il WS
    // console.log(body);

    // preparazione dati

    var args = { 
           ProtoIn : {
                Data: moment().format('DD/MM/YYYY'),
                DataDocumento: moment().format('DD/MM/YYYY'),

                NumeroDocumento: 1,
                Classifica: ENV_DATA.wsJiride.classificaDocumento,
                TipoDocumento: ENV_DATA.wsJiride.tipoDocumento,
                Oggetto: (ENV_DATA.wsJiride.oggettoDocumento || 'OGGETTO NON PRESENTE') + '  -  (' + reqId + ')',
                Origine: ENV_DATA.wsJiride.origineDocumento,
                MittenteInterno: ENV_DATA.wsJiride.ufficioInternoMittenteDocumento,
                //MittenteInterno_Descrizione": "",
                AnnoPratica: ENV_DATA.wsJiride.annoPratica,
                NumeroPratica: ENV_DATA.wsJiride.numeroPratica,
                 
               MittentiDestinatari: {
                MittenteDestinatario: [
                  {
                    // PATCH per segnalazione Maggioli - Miriam Saladino 
                    // RIMOZIONE DEL CODICE FISCALE NEI PARAMETRI PER EVITARE LA CONTAMINAZIONE CON LE
                    // ANAGRAFICHE 
                    // CodiceFiscale : objFilesList.codiceFiscaleRichiedente,
                    CodiceFiscale : '',
                    CognomeNome: objFilesList.cognomeRichiedente + ' ' + objFilesList.nomeRichiedente,
                    DataNascita : objFilesList.dataNascitaRichiedente,
                    Indirizzo : objFilesList.indirizzoRichiedente,
                    Localita : objFilesList.cittaRichiedente,
                    DataRicevimento: moment().format('DD/MM/YYYY'),
                    // Spese_NProt : 0,
                    // TipoSogg: 'S',
                    TipoPersona: ENV_DATA.wsJiride.tipoPersona,
                    Recapiti: {
                        Recapito: [
                            {
                                TipoRecapito: 'EMAIL',
                                ValoreRecapito: objFilesList.emailRichiedente
                            }
                        ]
                    }
                  }
                ]
              },
              
              AggiornaAnagrafiche : ENV_DATA.wsJiride.aggiornaAnagrafiche,
              InCaricoA : ENV_DATA.wsJiride.ufficioInternoDestinatarioDocumento,
              Utente : ENV_DATA.wsJiride.Utente,
              // Ruolo : ENV_DEFAULT_USER.wsJiride.ruolo,              
              Allegati: {  Allegato: []  }
            }
        };

    console.log('[' + ENV_DATA.idIstanza + '] protocolloModule:protocolloWS:args');
    console.log(args);

    // Aggiunta allegati
    console.log('[' + ENV_DATA.idIstanza + '] protocolloModule:protocolloWS:aggiunta allegati');

    // var DW_PATH = ENV_DATA.storageFolder;
    var dir = ENV.baseFolder + "/storage/" + ENV_DATA.idIstanza + "/" + reqId;
    
    console.log('[' + ENV_DATA.idIstanza + '] protocolloModule:protocolloWS:dir: ', dir);

    objFilesList.files.forEach(function(obj){
        console.log('adding:', dir + '/' + obj.name);
        ext = obj.name.substring(obj.name.length - 3);
        console.log(ext);

        // allegato principale
        args.ProtoIn.Allegati.Allegato.push(
            {
                TipoFile : ext,
                ContentType : mime.lookup(dir + '/' + obj.name),
                Image: utilityModule.base64_encode(dir + '/' + obj.name),
                NomeAllegato: obj.name,
                Commento : ''
            }
        );
    });

    // AGGIUNGE I metadati
    console.log('[' + ENV_DATA.idIstanza + '] protocolloModule:protocolloWS:aggiunta metadati');
    var fMetadati = reqId + '.txt';
    console.log('aggiunta metadati', fMetadati);
    args.ProtoIn.Allegati.Allegato.push(
        {
            TipoFile : 'txt',
            ContentType : mime.lookup(dir + '/' + fMetadati),
            Image: utilityModule.base64_encode(dir + '/' + fMetadati),
            NomeAllegato: fMetadati,
            Commento : ''
        }
    );

 
    var soapResult = { result : '....'};
 
    var soapOptions = {
        endpoint: WS_IRIDE_ENDPOINT
    };

    console.log('[' + ENV_DATA.idIstanza + '] protocolloModule:protocolloWS:crate and execute client');


    return new Promise(function (resolve, reject) {


        soap.createClient(WS_IRIDE, soapOptions, function(err, client){
            
            if (err) {
                var msg = 'Errore nella creazione del client soap';
                log.error('[' + ENV_DATA.idIstanza + ']' + msg);
                log.error(msg); 
                log.error(err); 
                reject(err);
            } else {

                client.InserisciProtocolloEAnagrafiche(args,  function(err, result) {
                //client.InserisciProtocollo(args,  function(err, result) {
                
                    if (err) {
                        var msg = 'Errore nella chiamata ad InserisciProtocollo';
                        log.error('[' + ENV_DATA.idIstanza + ']' + msg);
                        log.error(msg);  
                        log.error(err);  
                        console.log(args);
                        reject(err);
                    } else {
                        resolve(result);
                    }

                }); //client.InserisciProtocollo
            }

            });  //soap.createClient

     }); 
}
*/

// protocolloWS_V2

exports.protocolloWS_V2 = function(options) {

    console.log('[' + options.idIstanza + '] --------- protocolloWS_V2 ----------------------------');    
    console.log(options);
    
    WS_IRIDE = options.ws_url;
    WS_IRIDE_ENDPOINT = options.ws_endpoint;

    console.log('[' + options.idIstanza + '] protocolloModule:protocolloWS:Endpoint');
    console.log(WS_IRIDE);
    console.log(WS_IRIDE_ENDPOINT);

    // formattazione data per il WS
    // console.log(body);

    // preparazione dati

    var args = { 
           ProtoIn : {
                Data: moment().format('DD/MM/YYYY'),
                DataDocumento: moment().format('DD/MM/YYYY'),

                NumeroDocumento: 1,
                Classifica: options.classificaDocumento,
                TipoDocumento: options.tipoDocumento,
                Oggetto: options.oggettoDocumento,
                Origine: options.origineDocumento,
                MittenteInterno: options.ufficioInternoMittenteDocumento,
                //MittenteInterno_Descrizione": "",
                AnnoPratica: options.annoPratica,
                NumeroPratica: options.numeroPratica,
                 
               MittentiDestinatari: {
                MittenteDestinatario: [
                  {
                    // PATCH per segnalazione Maggioli - Miriam Saladino 
                    // RIMOZIONE DEL CODICE FISCALE NEI PARAMETRI PER EVITARE LA CONTAMINAZIONE CON LE
                    // ANAGRAFICHE 
                    // CodiceFiscale : objFilesList.codiceFiscaleRichiedente,
                    CodiceFiscale : '',
                    CognomeNome: options.cognomeRichiedente + ' ' + options.nomeRichiedente,
                    DataNascita : options.dataNascitaRichiedente,
                    Indirizzo : options.indirizzoRichiedente,
                    Localita : options.cittaRichiedente,
                    DataRicevimento: moment().format('DD/MM/YYYY'),
                    // Spese_NProt : 0,
                    // TipoSogg: 'S',
                    TipoPersona: options.tipoPersona,
                    Recapiti: {
                        Recapito: [
                            {
                                TipoRecapito: 'EMAIL',
                                ValoreRecapito: options.emailRichiedente
                            }
                        ]
                    }
                  }
                ]
              },
              
              AggiornaAnagrafiche : options.aggiornaAnagrafiche,
              InCaricoA : options.ufficioInternoDestinatarioDocumento,
              Utente : options.Utente,
              // Ruolo : ENV_DEFAULT_USER.wsJiride.ruolo,              
              Allegati: {  Allegato: []  }
            }
        };

    console.log('[' + options.idIstanza + '] protocolloModule:protocolloWS:args pacchetto per il protocollo');
    console.log(args);
        
    // Aggiunta allegati
    
    // var DW_PATH = options.storageFolder;
    var dir = ENV.baseFolder + "/storage/" + options.idIstanza + '/' + options.reqId;
    console.log('[' + options.idIstanza + '] protocolloModule:protocolloWS:aggiunta allegati:', dir);
    
    // se esistono allegati ...
    if(options.files) {

    options.files.forEach(function(obj){
        console.log('adding:', dir + '/' + obj.name);
        ext = obj.name.substring(obj.name.length - 3);
        console.log(ext);

        // allegato principale
        args.ProtoIn.Allegati.Allegato.push(
            {
                TipoFile : ext,
                ContentType : mime.lookup(dir + '/' + obj.name),
                Image: utilityModule.base64_encode(dir + '/' + obj.name),
                NomeAllegato: obj.name,
                Commento : ''
            }
        );
    });

    }

    if (options.metadata) {

    // AGGIUNGE I metadati
    console.log('[' + options.idIstanza + '] protocolloModule:protocolloWS:aggiunta metadati');
    var fMetadati = options.reqId + '.txt';
    console.log('aggiunta metadati', fMetadati);
    args.ProtoIn.Allegati.Allegato.push(
        {
            TipoFile : 'txt',
            ContentType : mime.lookup(dir + '/' + fMetadati),
            Image: utilityModule.base64_encode(dir + '/' + fMetadati),
            NomeAllegato: fMetadati,
            Commento : ''
        }
    );

    }

 
    var soapResult = { result : '....'};
 
    var soapOptions = {
        endpoint: WS_IRIDE_ENDPOINT
    };

    console.log('[' + options.idIstanza + '] protocolloModule:protocolloWS:crate and execute client');


    return new Promise(function (resolve, reject) {


        soap.createClient(WS_IRIDE, soapOptions, function(err, client){
            
            if (err) {
                var msg = 'Errore nella creazione del client soap';
                log.error('[' + options.idIstanza + ']' + msg);
                log.error(msg); 
                log.error(err); 
                reject(err);
            } else {

                client.InserisciProtocolloEAnagrafiche(args,  function(err, result) {
                //client.InserisciProtocollo(args,  function(err, result) {
                
                    if (err) {
                        var msg = 'Errore nella chiamata ad InserisciProtocollo';
                        log.error('[' + options.idIstanza + ']' + msg);
                        log.error(msg);  
                        log.error(err);  
                        console.log(args);
                        reject(err);
                    } else {
                        resolve(result);
                    }

                }); //client.InserisciProtocollo
            }

            });  //soap.createClient

     }); 
}


// mailWS invia una mail attraverso JIRIDE

exports.mailWS = function(options) {

    console.log('[' + options.idIstanza + '] --------- mailWS ----------------------------');    
    console.log(options);
    
    WS_POSTA = options.ws_posta;
    WS_POSTA_ENDPOINT = options.ws_posta_endpoint;

    console.log('[' + options.idIstanza + '] protocolloModule:protocolloWS:Endpoint');
    console.log(WS_POSTA);
    console.log(WS_POSTA_ENDPOINT);

    // formattazione data per il WS
    // console.log(body);

    // preparazione dati

    var args = { 
           messaggioIn : {
                docId: options.docId,
                oggettoMail : options.oggettoMail,
                testoMail : options.FormatoTesto,
                mittenteMail: options.mittenteMail,
                destinatariMail: {
                    destinatarioMail : 'ruggero.ruggeri@comune.rimini.it'
                },
                FormatoTesto : options.FormatoTesto,
                Utente : options.Utente,
                ruolo : options.ruolo

            }
        };

    console.log('[' + options.idIstanza + '] mailWS:args ');
    console.log(args);
        
     
    var soapResult = { result : '....'};
 
    var soapOptions = {
        endpoint: WS_POSTA_ENDPOINT
    };

    console.log('[' + options.idIstanza + '] protocolloModule:mailWS:crate and execute client');


    return new Promise(function (resolve, reject) {


        soap.createClient(WS_POSTA, soapOptions, function(err, client){
            
            if (err) {
                var msg = 'Errore nella creazione del client soap';
                log.error('[' + options.idIstanza + ']' + msg);
                log.error(msg); 
                log.error(err); 
                reject(err);
            } else {

                client.InviaMail(args,  function(err, result) {
                //client.InserisciProtocollo(args,  function(err, result) {
                
                    if (err) {
                        var msg = 'Errore nella chiamata ad InviaMail';
                        log.error('[' + options.idIstanza + ']' + msg);
                        log.error(msg);  
                        log.error(err);  
                        console.log(args);
                        reject(err);
                    } else {
                        resolve(result);
                    }

                }); //client.InserisciProtocollo
            }

            });  //soap.createClient

     }); 
}


// end