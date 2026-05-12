import { Router } from 'express';
import reportController from '../controllers/reportsController';

const router = Router();

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: List all P&L reports
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *         description: Number of reports to return (max 100)
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *         description: Number of reports to skip
 *     responses:
 *       200:
 *         description: Paginated list of reports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     total: { type: integer, description: Total number of reports }
 *                     limit: { type: integer }
 *                     offset: { type: integer }
 *                     reports:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           status: { type: string, enum: [processing, complete, failed] }
 *                           period_label: { type: string }
 *                           period_start: { type: string, format: date }
 *                           period_end: { type: string, format: date }
 *                           net_profit: { type: number }
 *                           currency: { type: string }
 *                           created_at: { type: string, format: date-time }
 *       400:
 *         description: Invalid query parameters
 */
router.get('/', reportController.listReports);

/**
 * @swagger
 * /reports/{id}:
 *   get:
 *     summary: Get a P&L report with nested line items
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report with nested line items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     status: { type: string, enum: [processing, complete, failed] }
 *                     period_label: { type: string }
 *                     period_start: { type: string, format: date }
 *                     period_end: { type: string, format: date }
 *                     total_revenue: { type: number }
 *                     total_cogs: { type: number }
 *                     gross_profit: { type: number }
 *                     total_expenses: { type: number }
 *                     net_operating_income: { type: number }
 *                     total_other_income: { type: number }
 *                     total_other_expenses: { type: number }
 *                     net_profit: { type: number }
 *                     currency: { type: string }
 *                     lineItems:
 *                       type: array
 *                       description: Top-level P&L sections, each with account-level children
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           name: { type: string }
 *                           category: { type: string }
 *                           amount: { type: number }
 *                           sort_order: { type: integer }
 *                           children:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id: { type: integer }
 *                                 name: { type: string }
 *                                 category: { type: string }
 *                                 amount: { type: number }
 *                                 sort_order: { type: integer }
 *       400:
 *         description: Invalid report ID
 *       404:
 *         description: Report not found
 */
router.get('/:id', reportController.getReportById);

export default router;
