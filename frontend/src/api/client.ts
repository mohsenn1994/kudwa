import axios, { AxiosError } from 'axios';
import type {
  ApiEnvelope,
  PipelineRun,
  ReportSummary,
  ReportDetail,
  ReportListResponse,
  LineItem,
} from '../types/backend';
import type {
  PnlNode,
  PnlNodeType,
  Period,
  ProfitAndLossReport,
} from '../types/display';

const baseURL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:3000';

export const http = axios.create({
  baseURL,
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
});

export class ApiClientError extends Error {
  code: string;
  status?: number;
  constructor(code: string, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// -- Generic wrapper to handle API responses and errors in a consistent way across all endpoints.
async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  try {
    const res = await promise;
    if (res.data.success) return res.data.data;
    // Backend error envelope: { success: false, message: string }
    throw new ApiClientError('API_ERROR', res.data.message);
  } catch (err) {
    if (err instanceof ApiClientError) throw err;
    if (err instanceof AxiosError) {
      const body = err.response?.data as ApiEnvelope<unknown> | undefined;
      if (body && body.success === false) {
        throw new ApiClientError('API_ERROR', body.message, err.response?.status);
      }
      throw new ApiClientError(
        'NETWORK_ERROR',
        err.message ?? 'Network request failed',
        err.response?.status,
      );
    }
    throw err;
  }
}


// -- Data mappers
// Convert the flat snake_case backend shapes into the hierarchical camelCase
// shapes the UI components expect.
function lineItemToNode(item: LineItem): PnlNode {
  const type: PnlNodeType =
    item.category === 'calculated' ? 
      'Total' : item.depth === 0 ? 
      'Section' : 'Account';
  return {
    id: item.id,
    name: item.name,
    type,
    section: item.pl_group,
    values: [Number(item.amount)],
    children: (item.children ?? []).map(lineItemToNode),
  };
}

function makePeriod(r: ReportSummary): Period {
  return { id: 0, label: r.period_label, startDate: r.period_start, endDate: r.period_end };
}

function mapReportToDisplay(r: ReportDetail): ProfitAndLossReport {
  return {
    reportId: r.id,
    source: r.sources_integrated?.join(' + ') || 'combined',
    currency: r.currency,
    startDate: r.period_start,
    endDate: r.period_end,
    periods: [makePeriod(r)],
    sections: (r.lineItems ?? []).map(lineItemToNode),
  };
}


// -- Public APIs
export const api = {
  health: () =>
    unwrap<{ status: string }>(http.get('/api/health/ready')),

  runIntegration: () =>
    unwrap<PipelineRun>(http.post('/api/integration/run')),

  getStatus: () =>
    unwrap<ReportSummary>(http.get('/api/integration/status')),

  listReports: (limit = 20, offset = 0) =>
    unwrap<ReportListResponse>(http.get('/api/reports', { params: { limit, offset } })),

  getReportDisplay: (id: string | number) =>
    unwrap<ReportDetail>(http.get(`/api/reports/${id}`)).then(mapReportToDisplay),
};
