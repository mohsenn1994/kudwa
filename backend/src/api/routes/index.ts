import express, { Router } from 'express';
import healthRoutes from './healthRoutes';
import integrationRoutes from './integrationRoutes';

export default function initRoutes(): Router {
  const router = express.Router();

  router.use(healthRoutes);
  router.use('/integration', integrationRoutes);

  return router;
}
