import { Router, Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';

export function createDashboardRouter(
  service: DashboardService = new DashboardService(),
): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await service.getSummary();
      res.json(summary);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
