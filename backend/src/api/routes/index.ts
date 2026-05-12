import express, { Router } from 'express';
import healthRoutes from './healthRoutes';
import integrationRoutes from './integrationRoutes';
import reportsRoutes from './reportsRoutes';

export default function initRoutes(): Router {
  const router = express.Router();

  router.use(healthRoutes);
  router.use('/integration', integrationRoutes);
  router.use('/reports', reportsRoutes);

  return router;
}
