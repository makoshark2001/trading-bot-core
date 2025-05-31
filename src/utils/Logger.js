const winston = require('winston');
const path = require('path');
const fs = require('fs');

class Logger {
    constructor() {
        // Ensure logs directory exists
        const logsDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'trading-bot' },
            transports: [
                // Write to all logs with level `info` and below to `app.log`
                new winston.transports.File({ 
                    filename: path.join(logsDir, 'app.log'),
                    level: 'info'
                }),
                // Write all logs error (and below) to `error.log`
                new winston.transports.File({ 
                    filename: path.join(logsDir, 'error.log'),
                    level: 'error'
                })
            ]
        });

        // If we're not in production, log to console too
        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            }));
        }
    }

    info(message, meta = {}) {
        this.logger.info(message, meta);
    }

    error(message, meta = {}) {
        this.logger.error(message, meta);
    }

    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }

    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }
}

// Export a singleton instance
module.exports = new Logger();