import express, { Router } from 'express';
import healthRoutes from './healthRoutes';

export default function initRoutes(): Router {
  const router = express.Router();

  router.use(healthRoutes);

  return router;
}
