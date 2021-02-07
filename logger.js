var winston = require('winston')
var logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            level:'info',
            timestamp: true
        }),
        new winston.transports.File({
            filename: './log.log',
            level: 'info',
            timestamp: true
        })
    ]
});

module.exports = logger;