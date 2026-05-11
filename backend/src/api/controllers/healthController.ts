import { Request, Response } from 'express';

const checkIsReady = (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'ready' });
};

const checkIsLive = (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'live' });
};

export default { checkIsReady, checkIsLive };
