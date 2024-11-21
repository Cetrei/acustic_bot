////   DEPENDENCIAS  ////
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
////   INICIO CODIGO ////
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    log: 3,
    debug: 4
}

function shouldLog(level) {
    return levels[level] <= levels[LOG_LEVEL];
}

module.exports = {
    error: (... args) => {
        if (shouldLog('error')) console.error(...args);
    },
    warn: (... args) => {
        if (shouldLog('warn')) console.warn(...args);
    },
    info: (... args) => {
        if (shouldLog('info')) console.info(...args);
    },
    log: (... args) => {
        if (shouldLog('log')) console.log(...args);
    },
    debug: (... args) => {
        if (shouldLog('debug')) console.debug(...args);
    }
};