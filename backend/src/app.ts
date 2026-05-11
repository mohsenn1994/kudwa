import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import responseFormatter from './middleware/responseFormatter';
import requestLogger from './middleware/requestLogger';
import initRoutes from './api/routes';
import { getErrorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);
app.use(responseFormatter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', initRoutes());


app.use(getErrorHandler());

export default app;
