import { Request, Response } from 'express';

const healthController = {
  checkIsReady(_req: Request, res: Response): void {
    res.json({ status: 'ready' });
  },

  checkIsLive(_req: Request, res: Response): void {
    res.json({ status: 'live' });
  },
};

export default healthController;
