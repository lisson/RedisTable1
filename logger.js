var winston = require('winston')
var logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            level:'debug',
            timestamp: true
        }),
        new winston.transports.File({
            filename: './log.log',
            level: 'debug',
            timestamp: true
        })
    ]
});

module.exports = logger;