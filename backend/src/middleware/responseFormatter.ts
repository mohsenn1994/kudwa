import { NextFunction, Request, Response } from 'express';

const responseFormatter = (req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json.bind(res);

  res.json = (body: unknown) => {
    if (res.statusCode >= 400) {
      return originalJson(body);
    }
    return originalJson({ data: body });
  };

  next();
};

export default responseFormatter;
