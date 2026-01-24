import express from 'express';
import logger from '#config/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { optionalAuthenticate } from '#middleware/auth.middleware.js';
import authRoutes from '#routes/auth.routes.js';
import userRoutes from '#routes/user.routes.js';
import securityMiddleware from '#middleware/security.middleware.js';

const app = express();

app.use(helmet());

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(optionalAuthenticate);

app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) },
  })
);
app.use(securityMiddleware);

app.get('/', (req, res) => {
  logger.info('Hello from Acquistions!');
  res.status(200).json('Hello from acquistions!');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Server is healthy',
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Acquistions api Running!!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

export default app;
