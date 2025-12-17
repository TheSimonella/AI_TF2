const { createLogger, format, transports } = require('winston');
const path = require('path');

// Create a filename that includes the current date/time (replace ":" with "-" for compatibility)
const logFilename = path.join(
  'logs',
  `combined_${new Date().toISOString().replace(/:/g, '-')}.log`
);

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: logFilename })
  ]
});

module.exports = logger;

