var jwt = require('jsonwebtoken');
var moment = require('moment');
var ENV = {};
var fs = require('fs');
const path = require('path');
var crypto = require('crypto');
var request = require('request');

const AppendInitVect = require('./appendInitVect');

var uMlog = {};
var base64url = require('base64url');

function addZero(x,n) {
      while (x.toString().length < n) {
        x = "0" + x;
      }
    return x;
}

// genera l'hash di una password
function getCipherKey(password) {
  return crypto.createHash('sha256').update(password).digest();
}

const validatorCaptchaExpressions = [
  {
    desc: 'LE PRIME QUATTRO cifre',
    regExp : /^.{0,4}/g
  },
  {
    desc: 'LE PRIME TRE cifre',
    regExp : /^.{0,3}/g
  },
  {
    desc: 'LE PRIME DUE cifre',
    regExp : /^.{0,2}/g
  },
  {
    desc: 'LE ULTIME TRE cifre',
    regExp : /.{3}$/g
  },
  {
    desc: 'LE ULTIME DUE cifre',
    regExp : /.{2}$/g
  }
];

var uMlog = {};

module.exports = {


  // funzioni per la cifratura e la decifratura di un file
  // crea un file .enc cifrato con password

  // imposta i parametri di configurazione
  setEnv : function( ENVp ) {

    ENV = ENVp;
    // var uMlog2 = require('./loggerModule.js')(ENV, 'UM'); 
    var uMlog2 = require('./loggerModuleWinston.js');
    var uMlog = uMlog2.buildRotateFileLogger(ENV.logWinstonConfig.logPath, ENV.logWinstonConfig.logName);
    // uMlog.info('START utilityModule.js');

    // uMlog = uMlog2;
    console.log('UM:setEnv');
    console.log('UM:secretKey:', ENV.secretKey);
    console.log('UM:tokenPath:', ENV.tokenPath);
    

  },


  encryptFile : function({ file, password }) {
    // Generate a secure, pseudo random initialization vector.
    const initVect = crypto.randomBytes(16);
    // Generate a cipher key from the password.
    const CIPHER_KEY = getCipherKey(password);
    const readStream = fs.createReadStream(file);
    // const gzip = zlib.createGzip();
    const cipher = crypto.createCipheriv('aes256', CIPHER_KEY, initVect);
    const appendInitVect = new AppendInitVect(initVect);
    // Create a write stream with a different file extension.
    const writeStream = fs.createWriteStream(path.join(file + ".enc"));
    
    readStream
      // .pipe(gzip)
      .pipe(cipher)
      .pipe(appendInitVect)
      .pipe(writeStream);
  },
  
  // crea un file .unenc decifrato
  decryptFile : function({ file, password }) {
    // First, get the initialization vector from the file.
    const readInitVect = fs.createReadStream(file, { end: 15 });
  
    let initVect;
    readInitVect.on('data', (chunk) => {
      console.log('data!');
      console.log(chunk);
      initVect = chunk;
    });
  
    // Once we’ve got the initialization vector, we can decrypt the file.
    readInitVect.on('end', () => {
      console.log('initVect');
      console.log(initVect);
      const cipherKey = getCipherKey(password);
      const readStream = fs.createReadStream(file, { start: 16 });
      const decipher = crypto.createDecipheriv('aes256', cipherKey, initVect);
      // const unzip = zlib.createUnzip();
      const writeStream = fs.createWriteStream(file + '.unenc');
  
      readStream
        .pipe(decipher)
        // .pipe(unzip)
        .pipe(writeStream);
    });
  },
  
  test : function(){
    console.log('test');
  },

 // https://gist.github.com/anvaka/3815296 
 // JavaScript Function Serialization
 // jsonString = JSON.stringify(person, functionReplacer);
 functionReplacer: function(key, value) {
    if (typeof(value) === 'function') {
        console.log(key);
        console.log(value.toString());
        return value.toString();
    }
    return value;
 },

 pad: function(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  },

  uint8ArrayToBase64Url : function(uint8Array, start, end) {
    start = start || 0;
    end = end || uint8Array.byteLength;

  const base64 = window.btoa(
    String.fromCharCode.apply(null, uint8Array.subarray(start, end)));
  return base64
    .replace(/\=/g, '') // eslint-disable-line no-useless-escape
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  },

// Converts the URL-safe base64 encoded |base64UrlData| to an Uint8Array buffer.
  base64UrlToUint8Array : function(base64UrlData) {
    const padding = '='.repeat((4 - base64UrlData.length % 4) % 4);
    const base64 = (base64UrlData + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const buffer = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        buffer[i] = rawData.charCodeAt(i);
    }
    return buffer;
    },

  base64_encode: function(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
  },

  base64_decode: function (base64str, file) {
    // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
    var bitmap = new Buffer(base64str, 'base64');
    // write buffer to file
    fs.writeFileSync(file, bitmap);
  },

  // https://stackoverflow.com/questions/8750780/encrypting-data-with-public-key-in-node-js
  encryptStringWithRsaPrivateKey64: function(toEncrypt) {
    var privateKey = fs.readFileSync(ENV.privateKey, "utf8");
    var buffer = new Buffer(toEncrypt);
    var encrypted = crypto.privateEncrypt(privateKey, buffer);
    var encrypted64 = base64url(encrypted);
    console.log('[#ENC64#]', toEncrypt);
    console.log('[#ENC64#]', encrypted);
    console.log('[#ENC64#]', encrypted64);
    return encrypted64;
  },

  // Encrypt with AES 64
  encryptStringWithAES_64: function(toEncrypt, iv) {

    let cipher_algorithm = 'AES-256-CBC';
    console.log('[#AES#e]','toEncrypt=', toEncrypt); // 098F6BCD4621D373CADE4E832627B4F6

    // get password's md5 hash
    let password = ENV.secretKey;
    console.log('[#AES#e]','password=', password); // 098F6BCD4621D373CADE4E832627B4F6

    // our data to encrypt
    // let data = '06401;0001001;04;15650.05;03';
    let data = toEncrypt;
    console.log('[#AES#e]','data=', data);
    console.log('[#AES#e]','iv=', iv);

    // encrypt data
    var cipher = crypto.createCipheriv(cipher_algorithm, password, iv);
    var encryptedData = cipher.update(data, 'utf8', 'base64');
    encryptedData += cipher.final('base64');
    console.log('[#AES#e]','encrypted data=', encryptedData);
    
    var encrypted64 = base64url(encryptedData);
    console.log('[#AES#e]','encrypted64 data=', encrypted64);

    // TO REMOVE!!! SOLO TEST DI VERIFICA 
    // var d1 = 'RFd1U2hIT29Qczh0dU4zOHJoU2FRVGF6cE5rMnltaG1pMHBRT0pIRHgvMGkxakllSEUwTTNidnJyaVJkLy92cndKdGxpcElKUDFhd3F6SGpjeEQ3MDM1NktGMzIvTU9mWVpORVR1ODN6Zmd2THh4dkUzRUhJMzFLWU53eDBqZXE3SDZudlFTMXRUbjJocjQyT2V6K3FWR1lWSkJWNjUxTVNIMGJMdjFDbXpGVlFJeW5UcDc5VHhsTTNIeE5vOC9iRE8rNEFVQWtLNDlYNktodXA4QTNzK0o3MUNFWFNNZERPVUZZMVFEZS81TT0';
    // var iv = 'GflWdWVhkGodG5yo';
    // var dataDecoded = base64url.decode(d1);
    // console.log('[#AES# - reverse]','encryptedDecoded data=', dataDecoded);
    // var decryptor = crypto.createDecipheriv(cipher_algorithm, password, iv);
    // var decryptedData = decryptor.update(dataDecoded, 'base64', 'utf8') + decryptor.final('utf8');
    // console.log('[#AES# - reverse]','decrypted data=', decryptedData);

    return encrypted64;
  },


  // Encrypt with AES 64
  decryptStringWithAES_64: function(toDecrypt, iv) {

      let cipher_algorithm = 'AES-256-CBC';
      console.log('[#AES#d]','toDecrypt=', toDecrypt);
      
  
      // get password's md5 hash
      let password = ENV.secretKey;
      console.log('[#AES#d]','password=', password); // 098F6BCD4621D373CADE4E832627B4F6
  
      console.log('[#AES#d]','data=', toDecrypt);
      console.log('[#AES#d]','iv=', iv);
  
      // decrypt data
      var dataDecoded = base64url.decode(toDecrypt);
      console.log('[#AES#d]','dataDecoded=', dataDecoded);

      var decryptor = crypto.createDecipheriv(cipher_algorithm, password, iv);
      var decryptedData = decryptor.update(dataDecoded, 'base64', 'utf8') + decryptor.final('utf8');
 
      console.log('[#AES#d]','decrypted data=', decryptedData);
      return decryptedData;
    },
  
  

  decryptStringWithRsaPrivateKey64: function(toDecrypt) {

  /*
    console.log('[##DEC64#] ', toDecrypt);
    var buffer1 = new Buffer(txt2crypt);
    var privateKey = fs.readFileSync(ENV.privateKey, "utf8");
    var encrypted = crypto.privateEncrypt(privateKey, buffer1);
    console.log('[##DEC64#]', encrypted);
    console.log('[##DEC64#]', encrypted.toString());
    console.log('[##DEC64#]', encrypted.toString("base64"));
  
    var land = encrypted.toString("base64");

    // console.log('[##DEC64#]', encrypted64);
    // var decoded64 = base64url.decode(encrypted64)
    // console.log('[##DEC64#]', decoded64);

    var buffer2 = new Buffer(land, "base64");

    var obj = {
      key: privateKey,
      padding: constants.RSA_PKCS1_PADDING
    };

    var decrypted = crypto.privateDecrypt(privateKey, buffer2);
    console.log('[##DEC64#]', decrypted);
  */

  var privateKey = fs.readFileSync(ENV.privateKey, "utf8");
  var publicKey = fs.readFileSync(ENV.publicKey, "utf8");

  
  var str2test = 'MARIO';
  console.log('[##DEC64#]-------------TEST BASE 64 -------------', str2test);
  const ciphers = crypto.getCiphers();
  console.log(ciphers); 

  // get password's md5 hash
  var password = 'password';
  var password_hash = crypto.createHash('md5').update(password, 'utf-8').digest('hex').toUpperCase();
  console.log('key=', password_hash); // 098F6BCD4621D373CADE4E832627B4F6

  // our data to encrypt
  var data = '06401;0001001;04;15650.05;03';
  console.log('data=', data);

  // generate initialization vector
  var iv = new Buffer.alloc(16); // fill with zeros
  console.log('iv=', iv);

  // encrypt data
  var cipher = crypto.createCipheriv('aes-256-cbc', password_hash, iv);
  var encryptedData = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
  console.log('encrypted data=', encryptedData.toUpperCase());



  console.log('[##DEC64#]', str2test);
  var encrypted64 = base64url(str2test);
  console.log('[##DEC64#]', encrypted64);
  var decoded = base64url.decode(encrypted64);
  console.log('[##DEC64#]', decoded);


  console.log('[##DEC64#]-------------TEST ENCRYPTION -------------');
  console.log('[##DEC64#] start : ',str2test);
  var buffer = new Buffer(str2test);
  var encrypted = crypto.publicEncrypt(publicKey, buffer);
  console.log('[##DEC64#] typeof encrypted : ', typeof encrypted);
  console.log('[##DEC64#] typeof encrypted : ', Buffer.isBuffer(encrypted));
  // console.log('[##DEC64#] typeof encrypted : ', encrypted.isEncoding('utf8'));

  console.log('[##DEC64#] encrypted :---------------------------');
  console.log(encrypted);
  var encrypted2string = encrypted.toString();
  console.log('[##DEC64#] encrypted2string -------------------------- :');
  console.log(encrypted2string);
  var encrypted64 = base64url(encrypted2string);
  console.log('[##DEC64#] encrypted64 -------------------------- :');
  console.log(encrypted64);
  var decoded = base64url.decode(encrypted64);
  console.log('[##DEC64#] decoded -------------------------- :');
  console.log(decoded);

  if( encrypted2string === decoded){
    console.log('[OK per la decodifica 64]');
  } else {
    console.log('[##########################################ROC64#] dec2str64 : DECODFICA NON UGUATE!');
    console.log('[##DEC64#] typeof encrypted64 : ', typeof encrypted2string);
    console.log('[##DEC64#] typeof decoded : ', typeof decoded);
  }

  /*
  'ascii' - for 7-bit ASCII data only. This encoding method is very fast and will strip the high bit if set.
  'utf8' - Multibyte encoded Unicode characters. Many web pages and other document formats use UTF-8.
  'utf16le' - 2 or 4 bytes, little-endian encoded Unicode characters. Surrogate pairs (U+10000 to U+10FFFF) are supported.
  'ucs2' - Alias of 'utf16le'.
  'base64' - Base64 string encoding. When creating a buffer from a string, this encoding will also correctly accept "URL and Filename Safe Alphabet" as specified in RFC 4648, Section 5.
  'binary' - A way of encoding the buffer into a one-byte (latin-1) encoded string. The string 'latin-1' is not supported. Instead, pass 'binary' to use 'latin-1' encoding.
  'hex' - Encode each byte as two hexadecimal characters.
  */

  var bufferASCII = new Buffer(decoded, 'ascii');
  var bufferUT = new Buffer(decoded, 'utf16le');
  var bufferUTF8 = new Buffer(decoded, 'utf8');
  var bufferBase64 = new Buffer(decoded, 'base64');
  // var bufferHex= new Buffer(decoded, 'hex');
  var bufferBin = new Buffer(decoded, 'binary');

  var source = new Buffer(encrypted2string);

  if (encrypted.equals(bufferUTF8)) {
    console.log('[OK per la ricostruzione del buffer]');
  } else {
    console.log('[--------ERROR----RICOSTRUZIONE DEL---------BUFFER----]');
    console.log('[##DEC64#] typeof encrypted : ', typeof encrypted);
    console.log('[##DEC64#] typeof buffer2   : ', typeof bufferUTF8);
    console.log(encrypted.toString());
    console.log(bufferUTF8.toString());
    console.log('[##DEC64#] list ------------------ ');
    console.log(encrypted);
    // console.log(source);
    console.log(bufferUTF8);
    console.log(bufferUT);
    console.log(bufferBase64);
    console.log(bufferASCII);
    // console.log(bufferHex);
    console.log(bufferBin);

  }
  
  console.log('[##DEC64#] buffer2 :---------------------------');
  


  // var buffer_decoded = new Buffer(decoded);
  var decrypted = crypto.privateDecrypt(privateKey, buffer2);
  console.log('[##DEC64#] end :',decrypted.toString());



  console.log('[##DEC64#]-------------END TEST ENCRYPTION -------------');

 /*

  console.log('[##DEC64#]', toDecrypt);
  var privateKey = fs.readFileSync(ENV.privateKey, "utf8");
  var decrypted64 = base64url.decode(toDecrypt);
  console.log('[#DEC64#]', decrypted64);
  // var buffer = new Buffer(decrypted64, "base64");
  var buffer = new Buffer(decrypted64);
  // OPENSSL_PKCS1_PADDING
    
  var obj = {
     key: privateKey,
      padding: constants.RSA_PKCS1_PADDING
  };
  var decrypted = crypto.privateDecrypt(obj, buffer);
  console.log('[#DEC64#]', decrypted);
  */
    
  return decrypted;
  },


  /* controlla se esiste il token ed è consistente 
  
    return false se non è autenticato o l'user autenticato
  */

  ensureAuthenticatedFun : function(req) {
    console.log('[#AUTHF#] ensureAuthenticated (start)');
    if (!req.header('Authorization')) {
        console.log('[#AUTHF#] ensureAuthenticated : 401 NO TOKEN');
        return false;
    }
      var token = req.header('Authorization').split(' ')[1];
      // console.log(req.header('Authorization'));
      var payload = null;
      try {
        payload = jwt.decode(token, ENV.secret);
      }
      catch (err) {
        console.log('[#AUTHF#] ensureAuthenticated decoded error');
        uMlog.log('[#AUTHF#] ensureAuthenticated decoded error');
        uMlog.error(err);
        return false;
      }

      if(payload){
        if (payload.exp) {
          console.log('[#AUTHF#] token timeout check..');
          if (payload.exp <= moment().unix()) {
            console.log('[#AUTHF#] token expired');
            console.log(payload.exp, moment().unix());
            return false;
          } else {
            console.log('[#AUTHF#] token NOT expired');
            console.log('[#AUTHF#] payload.exp :', payload.exp);
            console.log('[#AUTHF#] now         :', moment().unix());
          }
        } else {
          var msg = '[#AUTHF#] ensureAuthenticated decoded error - exp NOT FOUND';
          console.log(msg);
          return false;
        }
      } else {
        var msg = '[#AUTHF#] ensureAuthenticated decoded error - payload NOT FOUND';
        console.log(msg);
        return false;
      }

      console.log('[#AUTHF#] token OK! go!');
      var user = {};
      user = payload.sub;
      user.token = token;
      user.exp = payload.exp;
      return user;
  },

  /* come sopra ma protegge la route */
  ensureAuthenticated : function(req, res, next) {

        //"Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOnsiY29tcGFueU5hbWUiOiJDb211bmVfZGlfUmltaW5pIiwiYXBwIjoicHJvdG9jb2xsbyJ9LCJpYXQiOjE0Nzk5OTkwMzQsImV4cCI6MTU2NjM5NTQzNH0.5Ako1xZ9If5bNrKN3ns8sZ8YaqaJD7FWDt07zcRb8c0"

        uMlog.debug('[#AUTH#] ensureAuthenticated ... ');
        if (!req.header('Authorization')) {
            uMlog.error('[#AUTH#] ensureAuthenticated : 401 NO TOKEN');
            // uMlog.error(util.inspect(req.headers));
            uMlog.error(JSON.stringify(req.headers));
            return res.status(401).send({ message: 'Effettuare login prima di procedere (401 NO TOKEN)' });
        }
          var token = req.header('Authorization').split(' ')[1];
         
          // console.log(req.header('Authorization'));
          var payload = null;
          try {
            payload = jwt.decode(token, ENV.secret);
          }
          catch (err) {
            uMlog.error('[#AUTH#] ensureAuthenticated decoded error');
            uMlog.error(err);
            uMlog.error(JSON.stringify(req.headers));
            return res.status(401).send({ message: err.message });
          }

          // console.log(payload);

          if(payload){
            if (payload.exp) {
              if (payload.exp <= moment().unix()) {
                uMlog.error('[#AUTH#] ensureAuthenticated token expired');
                console.log(payload.exp, moment().unix());
                uMlog.error(JSON.stringify(req.headers));
                return res.status(402).send({ 
                  title: 'Sessione scaduta',
                  message: 'Sessione scaduta - Disconnettersi e poi rifare la procedura di autenticazione'
                });
              } else {
                uMlog.debug('[#AUTH#] ensureAuthenticated token NOT expired', payload.exp, moment().unix() );
              }
            } else {
              var msg = '[#AUTH#] ensureAuthenticated decoded error - exp NOT FOUND';
              uMlog.error(msg);
              uMlog.error(JSON.stringify(req.headers));
              return res.status(401).send({ message: msg });
            }
          } else {
            var msg = '[#AUTH#] ensureAuthenticated decoded error - payload NOT FOUND';
            uMlog.error(msg);
            uMlog.error(JSON.stringify(req.headers));
            return res.status(401).send({ message: msg });
          }

          console.log('[#AUTH#] ensureAuthenticated ok pass');
          req.user = payload.sub;
          req.token = token;
          next();
    },

    notUserDemo: function(req, res, next) {
      console.log('[#AUTH#] notUserDemo ');
      if( req.user.name == 'DEMO'){
        return res.status(401).send({ message: '[#AUTH#] notUserDemo : NOT ALLOWED!' });
      }
      console.log('[#AUTH#] notUserDemo ' + req.user.name);
      next();
    },


    // controllo se esiste e se è corretto il token passato
    checkIfTokenInList: function(req, res, next) {

      console.log('[#AUTH#] checkIfTokenInList ');
      if (!req.header('ISTANZE-API-KEY')) {
        console.log('[#AUTH#] checkIfTokenInList : 401 NO TOKEN');
        return res.status(401).send({ msg: 'Effettuare login prima di procedere (401 NO TOKEN)' });
      }

      var token = req.header('ISTANZE-API-KEY');
       // .set('ISTANZE-API-KEY', 'foobar')
     
      if(token){
        console.log(token);
        var md5Token = crypto.createHash('md5').update(token).digest("hex");
        var fName = ENV.tokenPath + '/' + md5Token;
        console.log('[#AUTH#] checkIfTokenInList: ' + fName);
      
        if (!fs.existsSync(fName)) {
              console.log('[#AUTH#] checkIfTokenInList : TOKEN not exists in path');
              return res.status(401).send({ msg: 'Token non presente in lista autorizzazioni' });
        }
        
        console.log('[#AUTH#] checkIfTokenInList: OK!');
        console.log('[#AUTH#] checkIfTokenInList: remove token file! ' + fName);
        fs.unlinkSync(fName);
        
        next();
      } else {
          console.log('[#AUTH#] checkIfTokenInList : TOKEN not exists');
          return res.status(402).send({ msg: 'Token non presente' });
      }

    },
    
    createJWT: function(user, timeout1, timeout2) {

          console.log('utilityModule.js:createJWT');
          // moment.js syntax 
          // https://momentjs.com/docs/#/manipulating/add/
          // moment().add(7, 'd');
          timeout1 = timeout1 || ENV.sessionTokenTimeOut;
          timeout2 = timeout2 || ENV.sessionTokenTimeType;
          // console.log('TIME >>>> ', timeout1, timeout2);
          console.log('utilityModule.js:timeout1:', timeout1);
          console.log('utilityModule.js:timeout2:', timeout2);
          timeOut = moment().add(timeout1, timeout2).unix();
          user.sessionTimeout = timeOut;
          console.log('utilityModule.js:now     :', moment().unix());
          console.log('utilityModule.js:timeout :', timeOut);

          // console.log('TIME >>>> ', moment().unix(), moment().add(timeout1, timeout2).unix());

          var payload = {
            sub: user,
            iat: moment().unix(),
            // timeout di 8 ore
            exp: timeOut
          };
          return jwt.sign(payload, ENV.secret);
    },

    decodeJWT: function(token) {
        //console.log(token);
          var payload = null;
          try {
            payload = jwt.decode(token, ENV.secret);
            if (payload.exp <= moment().unix()) {
              console.log('utilityModule.js:decodeJWT:token expired');
              // 1563184518 1563184642
              console.log(payload.exp, moment().unix());
            }
            return payload;
          }
          catch (err) {
            console.log('utilityModule.js:decodeJWT:ensureAuthenticated decoded error');
            console.log(err);
            return {};
          }

          console.log(payload);
    },

    addTokenToList: function(token, content) {
      // save file
      var md5Token = crypto.createHash('md5').update(token).digest("hex");
      var fName = ENV.tokenPath + '/' + md5Token;
      console.log('utilityModule.js:addTokenToList:' + fName);
      fs.writeFileSync(fName, ( content ? content : token)) ;
    },

    removeTokenFromList: function(token) {
      var md5Token = crypto.createHash('md5').update(token).digest("hex");
      var fName = ENV.tokenPath + '/' + md5Token;
      console.log('utilityModule.js:removeTokenFromList...' + fName);
      // ge
      var content = fs.readFileSync(fName,"utf8");
      fs.unlinkSync(fName);
      return content;
    },

    existsTokenInList: function(token) {
      var md5Token = crypto.createHash('md5').update(token).digest("hex");
      var fName = ENV.tokenPath + '/' + md5Token;
      console.log('utilityModule.js:existsTokenInList...' + fName);
      if (fs.existsSync(fName)) {
        console.log('utilityModule.js:existsTokenInList...TOKEN exists!');
        return true;
      } else {
        console.log('utilityModule.js:existsTokenInList...TOKEN NOT exists!');
        return false;
      }
    },
    
    getNowFormatted: function(strTime2Add) {

          var d = new Date(),
          month = '' + (d.getMonth() + 1),
          day = '' + d.getDate(),
          year = d.getFullYear();

          if (month.length < 2) month = '0' + month;
          if (day.length < 2) day = '0' + day;
    
          var time = [ d.getHours(), d.getMinutes(), d.getSeconds() ];
          var ms = addZero(d.getMilliseconds(), 3);

          console.log('UtilsService:getNowFormatted');


          var suffix = Math.floor(Math.random()*90000) + 10000;

            for ( var i = 1; i < 3; i++ ) {
              if ( time[i] < 10 ) {
                time[i] = "0" + time[i];
              }
            }

          console.log(time.join(""));  

          var timeFormatted = [year, month, day].join('-');
          if (strTime2Add) {
            timeFormatted = timeFormatted + strTime2Add;
          } 

          // Return the formatted string
          return timeFormatted;
          //return date.join("") + "@" + time.join("") + "@" + suffix;

    },


    getTimestampPlusRandom: function() {

          var d = new Date(),
          month = '' + (d.getMonth() + 1),
          day = '' + d.getDate(),
          year = d.getFullYear();

          if (month.length < 2) month = '0' + month;
          if (day.length < 2) day = '0' + day;
    
          var time = [ d.getHours(), d.getMinutes(), d.getSeconds() ];
          var ms = addZero(d.getMilliseconds(), 3);

          // console.log('UtilsService');
          // console.log(time);

          var suffix = Math.floor(Math.random()*90000) + 10000;

            for ( var i = 1; i < 3; i++ ) {
              if ( time[i] < 10 ) {
                time[i] = "0" + time[i];
              }
            }
          // console.log(time.join(""));  
          // Return the formatted string
          return [year, month, day].join('') + "@" + time.join("") + "@" + ms + "@" + suffix;
          //return date.join("") + "@" + time.join("") + "@" + suffix;
    },

    checkAppVersion: function(req, res, next) {
       //"Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOnsiY29tcGFueU5hbWUiOiJDb211bmVfZGlfUmltaW5pIiwiYXBwIjoicHJvdG9jb2xsbyJ9LCJpYXQiOjE0Nzk5OTkwMzQsImV4cCI6MTU2NjM5NTQzNH0.5Ako1xZ9If5bNrKN3ns8sZ8YaqaJD7FWDt07zcRb8c0"

        console.log('[#APPVERSION#] (start)');
        if (!req.header('AppVersion')) {
            console.log('[#APPVERSION#] 401 NO header');
            return res.status(401).send({ message: 'Errore generico nel controllo della versione della app' });
        }
        var token = req.header('AppVersion');
        console.log('header:' + token);
        console.log('server:'+ ENV.app_version);
        var versionInfo =  '(local:' + token + '-remote:'+ ENV.app_version + ')';
        if (token != ENV.app_version ){
          console.log('[#APPVERSION#] ricaricare app versione cambiata');
          return res.status(418).send({ 
            title: 'Stai utilizzanto una versione della applicazione obsoleta',
            message: "La versione della applicazione è stata aggiornata. E' necessario effettuare la disconnessione, chiudere il browser e riaprirlo per ottenere l'applicazione aggiornata. " + versionInfo });
        }

        console.log('[#APPVERSION#] ok pass');
        next();
    },

    emailSend: function(mailOptions){
      var transporter = nodemailer.createTransport(ENV.smtpConfig);
      /*
      var mailOptions = {
                      from: '"Comune di Rimini - Istanze Digitali" <ruggero.ruggeri@comune.rimini.it>', // sender address
                      to: objFieldSanitized.emailRichiedente, // list of receivers
                      subject: 'Promemoria presentazione istanza digitale', 
                      // text: msg, // plaintext body
                      html: htmlResponseMsg // html body
                  };
      */
      return new Promise(function (resolve, reject) {
          transporter.sendMail(mailOptions, function(error, info){
                  if(error){
                          logConsole.error('emailSend ERROR!');
                          logConsole.error(error);
                          reject(error);
                  } else {
                          logConsole.info('Email sent!');
                          resolve('Email Sent!');
                      }
                  });
              });   
    },

    /* Funzione di verifica per SVG Captcha */
    svgVerifyReCaptcha: function(ReCaptchaId, sol) {
      console.log('[#AUTH#] svgVerifyReCaptcha');
      
      // check token
      if (!ReCaptchaId) {
        console.log('[#AUTH#] svgVerifyReCaptcha : 401 NO TOKEN');
        return false;
      }

      var fName = ENV.tokenPath + '/captcha-' + ReCaptchaId;
      // get token data
      try {
        var fileContents = fs.readFileSync(fName).toString();
        var capthaJsonData = JSON.parse(fileContents);
        // console.log(capthaJsonData);
      } catch (e) {
        console.log('[#AUTH#] svgVerifyReCaptcha file open error', fName);
        console.log(e);
        return false;
      }

      console.log('[#AUTH#] svgVerifyReCaptcha : ', sol, capthaJsonData.solution);

      if (sol === capthaJsonData.solution) {
        return true;
      } else {
        return false;
      }


      // verify response


      // return

    },

    /* Funzione di verifica per Captch di Google */
    verifyReCaptcha: function(ReCaptcha) {

      console.log('[#AUTH#] verifyReCaptcha');
      return new Promise(function (resolve, reject) {

        if (!ReCaptcha) {
          console.log('[#AUTH#] verifyReCaptcha : 401 NO TOKEN');
          reject({ msg: 'Effettuare login prima di procedere (401 NO TOKEN)' });
        }

        var data = {
            secret: ENV.recaptchaSecret, 
            response: ReCaptcha
        };
             
        var url = 'https://www.google.com/recaptcha/api/siteverify';
        console.log('[#AUTH#] verifyReCaptcha:url: ', url);

        var options = {
            uri: url,
            method: 'POST',
            proxy: ENV.proxy_url,
            json: true,
            qs: data
        };

        request(options, function (error, response, body) {
            if (error) {
                console.log('[#AUTH#] verifyReCaptcha:Errore invio richiesta ...');
                console.log(error);
                reject(error);
            }
            if (!error && response.statusCode == 200) {
                console.log('[#AUTH#] verifyReCaptcha: risposta OK! ');
                console.log('[#AUTH#] verifyReCaptcha: statusCode', response.statusCode);
                console.log(response.body);
                if(response.body.success){
                    resolve(response);
                } else {
                    reject(response);
                }
            } else {
                console.log('[#AUTH#] verifyReCaptcha: statusCode', response.statusCode);
                console.log('[#AUTH#] verifyReCaptcha GENERICO invio richiesta ...', response);
                reject(response);
            }
        });
    });
  },


  // svgCaptcha per non utilizzare quello di Google - GDPR

  createSvgCaptcha: function() {
    console.log('[#AUTH#] createSvgCaptcha');
    const id = this.getTimestampPlusRandom();
    console.log('[#AUTH#] id:', id);

    var retObj = {};
    var saveObj = {};

    var svgCaptcha = require('svg-captcha');
    var captcha = svgCaptcha.create(
      {
        size: 5,
        noise: 0,
        ignoreChars: 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0', // filter out some characters like 0o1i 
        color: false}
      );
    
    // console.log(captcha.text);
    // console.log(captcha.data);
    const iRandom = Math.floor(Math.random() * validatorCaptchaExpressions.length);
    
    // console.log(new Buffer(captcha.data).toString('base64'));

    var svgB64 = "data:image/svg+xml;base64," + new Buffer(captcha.data).toString('base64');

    // captcha.infoText = validatorCaptchaExpressions[iRandom];
    // prepara l'oggetto e lo scrive su file    
    // captcha.iRandom = iRandom;

    retObj.captchaId = id;
    retObj.captchaSvgImage = svgB64;
    retObj.captchaInfoText = validatorCaptchaExpressions[iRandom].desc;

    var captchaText = captcha.text;
    var captchaSolution = captchaText.match(validatorCaptchaExpressions[iRandom].regExp)[0];

    saveObj.captchaId = id;
    saveObj.iRandom = iRandom;
    saveObj.text = captcha.text;
    saveObj.solution = captchaSolution;

    this.addCaptchaToList(id, saveObj);

    return retObj;
  },


  addCaptchaToList: function(id, captcha) {
    // save file
    // var md5Token = crypto.createHash('md5').update(token).digest("hex");
    var fName = ENV.tokenPath + '/captcha-' + id;
    console.log('addCaptchaToList:' + fName);
    fs.writeFileSync(fName, JSON.stringify(captcha));
  },

  removeCaptchaFromList: function(id) {
    // var md5Token = crypto.createHash('md5').update(token).digest("hex");
    var fName = ENV.tokenPath + '/captcha-' + id;
    console.log('removeCaptchaFromList:' + fName);
    fs.unlinkSync(fName);
  }


}