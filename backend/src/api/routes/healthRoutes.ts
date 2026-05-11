import express from 'express';
import healthController from '../controllers/healthController';

/**
 * @preserve
 * @swagger
 * tags:
 *   - name: Health
 *     description: Operations related to checking API health
 */

/**
 * @preserve
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Get API health status
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API is ready
 *       409:
 *         description: API is not ready
 * /health/live:
 *   get:
 *     summary: Get API live status
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API is live
 *       409:
 *         description: API is not live
 */

const router = express.Router();

router.get('/health/ready', healthController.checkIsReady);
router.get('/health/live', healthController.checkIsLive);

export default router;
