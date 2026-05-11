import { Request, Response, NextFunction } from 'express';
import { runPipeline } from '../../etl';
// import { ProfitLossReport } from '../../models';

const integrationController = {
  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await runPipeline();
      res.json({ success: true, data: result, message: 'ETL pipeline completed successfully' });
    } catch (error) {
      next(error);
    }
  },

  async status(req: Request, res: Response, next: NextFunction): Promise<void> {
  },
};

export default integrationController;
