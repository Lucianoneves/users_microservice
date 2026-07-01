import { DashboardSummary } from './types';

export class DashboardService {
  async getSummary(): Promise<DashboardSummary> {
    // TODO: aggregate user counts, auth stats, and other service metrics
    return {
      generatedAt: new Date().toISOString(),
      sections: [],
    };
  }
}
