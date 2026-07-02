export interface DashboardMetric {
  id: string;
  label: string;
  value: number;
}

export interface DashboardSection {
  id: string;
  title: string;
  metrics: DashboardMetric[];
}

export interface DashboardSummary {
  generatedAt: string;
  sections: DashboardSection[];
}
