import { Request, Response, NextFunction } from 'express';
import { ProfitLossReport, ProfitLossLineItem } from '../../models';

const reportController = {
  async listReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      if (offset < 0) {
        res.status(400).json({ message: 'offset must be >= 0' });
        return;
      }

      const { count, rows } = await ProfitLossReport.findAndCountAll({
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      res.json({ total: count, limit, offset, reports: rows });
    } catch (error) {
      next(error);
    }
  },

  async getReportById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id) || id < 1) {
        res.status(400).json({ message: 'Invalid report ID' });
        return;
      }

      const report = await ProfitLossReport.findByPk(id, {
        include: [{
          model: ProfitLossLineItem,
          as: 'lineItems',
          where: { parent_id: null },
          required: false,
          include: [{
            model: ProfitLossLineItem,
            as: 'children',
            required: false,
          }],
        }],
      });

      if (!report) {
        res.status(404).json({ message: 'Report not found' });
        return;
      }

      res.json(report);
    } catch (error) {
      next(error);
    }
  },
};

export default reportController;
