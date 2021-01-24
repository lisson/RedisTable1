var winston = require('winston')
var logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            level:'info'
        }),
        new winston.transports.File({
            filename: './log.log',
            level: 'info'
        })
    ]
});

module.exports = logger;