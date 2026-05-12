/**
 * Raw shapes the backend API returns (snake_case, flat).
 * Mapping to display types lives in api/client.ts.
 */

export interface ApiSuccess<T> { success: true; data: T }
export interface ApiError      { success: false; message: string }
export type ApiEnvelope<T> = ApiSuccess<T> | ApiError;

/** POST /api/integration/run */
export interface PipelineRun {
  duration: string;
  accountsLoaded: number;
  transactionsLoaded: number;
  reportId: string;
  periodLabel: string;
  netProfit: number;
}

export type ReportStatus = 'processing' | 'complete' | 'failed';

/** Shared by GET /api/integration/status and items in GET /api/reports */
export interface ReportSummary {
  id: string;
  period_start: string;
  period_end: string;
  period_label: string;
  currency: string;
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  total_expenses: number;
  net_operating_income: number;
  total_other_income: number;
  total_other_expenses: number;
  net_profit: number;
  sources_integrated: string[];
  status: ReportStatus;
}

/** Single line item inside GET /api/reports/:id */
export interface LineItem {
  id: string;
  name: string;
  category: 'revenue' | 'expense' | 'calculated';
  pl_group: string;
  amount: number;
  depth: number;
  sort_order: number;
  period_start: string;
  period_end: string;
  children: LineItem[] | undefined;
}

/** GET /api/reports/:id — report with its full line item tree */
export interface ReportDetail extends ReportSummary {
  lineItems: LineItem[];
}

/** GET /api/reports — paginated list */
export interface ReportListResponse {
  reports: ReportSummary[];
  total: number;
  limit: number;
  offset: number;
}
