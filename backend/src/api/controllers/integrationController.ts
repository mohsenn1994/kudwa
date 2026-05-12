import { Request, Response, NextFunction } from 'express';
import { runPipeline } from '../../etl';
import { ProfitLossReport } from '../../models';

const integrationController = {
  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await runPipeline();
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async status(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await ProfitLossReport.findOne({
        order: [['created_at', 'DESC']],
      });

      if (!report) {
        res.status(404).json({ message: 'No pipeline run found' });
        return;
      }

      res.json(report);
    } catch (error) {
      next(error);
    }
  },
};

export default integrationController;
