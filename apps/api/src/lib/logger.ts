import winston from 'winston';

const { combine, timestamp, printf } = winston.format;

const customFormat = printf(({ level, message, timestamp: ts }) => {
  return `[${level.toUpperCase()}] ${ts} — ${message}`;
});

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat,
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

export default logger;
