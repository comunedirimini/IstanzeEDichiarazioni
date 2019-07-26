/* winston logger module*/

var winston = require('winston');
require('winston-daily-rotate-file');
require('winston-mail');

const { splat, combine, timestamp, printf, label } = winston.format;
const { createLogger, format, transports } = require('winston');

const moment = require('moment');
const path = require('path');

var loggers = [];

function printWinstonExtraInfo (info) {
    const skpippedProperties = ['message', 'timestamp', 'level'];
    let response = '';
    let responseObj = {};

    // console.log(typeof(info));
    // console.log(info);
  
    if (info[Symbol.for('splat')]) {
        // console.log(typeof(info[Symbol.for('splat')]));
        if(info[Symbol.for('splat')][0]){
            // console.log('TYPE:', typeof(info[Symbol.for('splat')][0]));  
            if( typeof(info[Symbol.for('splat')][0]) === 'object') {
                
                
                for (let key in info) {
                  // console.log(key);
                  let value = info[key];
                  if (skpippedProperties.includes(key)) { continue };
                  if (value === undefined || value === null) { continue };
                  response += `${key}=${value} `;
                  responseObj[key] = value;
                }
              
                // console.log('RETO:', JSON.stringify(responseObj));
                return JSON.stringify(responseObj);

            }   

            if( typeof(info[Symbol.for('splat')][0]) === 'string') {

                // console.log('RETS:', info[Symbol.for('splat')][0]);
                return info[Symbol.for('splat')][0];

            }   

            // console.log('RETN:', '-null-');
            return '';

        }    
    } else {

        // console.log('RETV:', '-null-');
        return '';


    }   
    
    // console.log(typeof(info[Symbol.for('splat')]));
    // console.log(typeof(info[Symbol.for('splat')][0]));
    // console.log(info[Symbol.for('splat')][0]);

    
}

/*
 * Simple helper for stringifying all remaining
 * properties.
 */
function rest(info) {
    return JSON.stringify(Object.assign({}, info, {
      level: undefined,
      message: undefined,
      splat: undefined,
      label: undefined
    }));
}

/*
var loggerMail = new winston.createLogger({ 
    
    transports: [
    new winston.transports.Mail({
        to: 'ruggero.ruggeri@comune.rimini.it',
        from: 'ruggero.ruggeri@comune.rimini.it',
        subject : '[LOG - ]',
        host: 'srv-mail.comune.rimini.it',
        port: 25
    })
] });
*/

module.exports = {

buildRotateFileLogger: function(logFilepath, prefixFileName) {
    
    return winston.createLogger({ 

      format: winston.format.combine(
          winston.format.timestamp({
              format: moment().format('YYYY-MM-DD hh:mm:ss').trim()
            }),
          winston.format.printf(info => {
              // console.log(info);
              return `[${info.timestamp}] [${info.level}] : ${JSON.stringify(info.message)} : ${printWinstonExtraInfo(info)}`;
            })
        ),
      transports: [
      new winston.transports.DailyRotateFile({
          name: 'file',
          datePattern: 'YYYY-MM-DD',
          filename: path.join( logFilepath, prefixFileName + '-%DATE%.log')
        })
      ] 
  });
  
},

buildMailLogger: function(options) {
    
    return winston.createLogger({ 

        transports: [
            new winston.transports.Mail({
                to: options.to,
                from: options.from,
                subject : options.subject,
                host: options.host,
                port: options.port
            })
        ]
  });
  
},

buildConsoleLogger: function() {
    return winston.createLogger({ 
      

        format: winston.format.combine(
            winston.format.timestamp({
                format: moment().format('YYYY-MM-DD hh:mm:ss').trim()
              }),
            // winston.format.splat(),
            winston.format.printf(info => {
                // console.log(typeof(info[Symbol.for('splat')]));
                // console.log(typeof(info[Symbol.for('splat')][0]));
                // console.log(info[Symbol.for('splat')][0]);
                return `[${info.timestamp}] [${info.level}] : ${JSON.stringify(info.message)} : ${printWinstonExtraInfo(info)}`;
                //return `[${info.timestamp}] [${info.level}] : ${JSON.stringify(info.message)} : ${rest(info)}`;
              })
        ),

        
        transports: [  new winston.transports.Console({
            // timestamp: tsFormat
            /*,
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.label({ label: '[my-label]' }),
              winston.format.colorize(),
              winston.format.simple()
            )
            */
          })
        ] 
    });        
}



} /*END MODULE*/





