/**
 * Simple logging framework
 */

const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({ level: 'info', message, timestamp: new Date().toISOString(), ...meta }));
  },
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({ level: 'warn', message, timestamp: new Date().toISOString(), ...meta }));
  },
  error: (message, error = null, meta = {}) => {
    const errorDetails = error ? { errorMessage: error.message, stack: error.stack } : {};
    console.error(JSON.stringify({ level: 'error', message, timestamp: new Date().toISOString(), ...errorDetails, ...meta }));
  },
  debug: (message, meta = {}) => {
    if (!isProduction) {
      console.debug(JSON.stringify({ level: 'debug', message, timestamp: new Date().toISOString(), ...meta }));
    }
  }
};
