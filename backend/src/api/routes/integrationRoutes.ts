import { Router } from 'express';
import integrationController from '../controllers/integrationController';

const router = Router();

/**
 * @swagger
 * /integration/run:
 *   post:
 *     summary: Trigger the ETL pipeline
 *     tags: [Integration]
 *     responses:
 *       200:
 *         description: Pipeline completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     duration: { type: string }
 *                     accountsLoaded: { type: integer }
 *                     transactionsLoaded: { type: integer }
 *                     reportId: { type: integer }
 *       500:
 *         description: Pipeline failed
 */
router.post('/run', integrationController.run);

/**
 * @swagger
 * /integration/status:
 *   get:
 *     summary: Get the status of the last ETL run
 *     tags: [Integration]
 *     responses:
 *       200:
 *         description: Latest report status
 */
router.get('/status', integrationController.status);

export default router;
