import winston from 'winston';

const winstonLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...data }) => {
      const extra = Object.keys(data).length ? ' ' + JSON.stringify(data) : '';
      return `${timestamp} [${level.toUpperCase()}] ${message}${extra}`;
    }),
  ),
  transports: [new winston.transports.Console()],
});

const logger = {
  info: (message: string, data?: Record<string, unknown>) =>
    winstonLogger.info(message, data),
  warn: (message: string, data?: Record<string, unknown>) =>
    winstonLogger.warn(message, data),
  error: (message: string, data?: Record<string, unknown>) =>
    winstonLogger.error(message, data),
  debug: (message: string, data?: Record<string, unknown>) =>
    winstonLogger.debug(message, data),
};

export default logger;
