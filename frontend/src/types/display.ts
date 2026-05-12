/**
 * Shapes the UI components consume (camelCase, hierarchical).
 * Mapped from backend types in api/client.ts.
 */

export type PnlNodeType = 'Section' | 'Account' | 'Total';

export interface PnlNode {
  id: number | string;
  name: string;
  type: PnlNodeType;
  section: string;
  values: number[];
  children: PnlNode[];
}

export interface Period {
  id: number;
  label: string;
  startDate: string;
  endDate: string;
}

export interface ProfitAndLossReport {
  reportId: string;
  source: string;
  currency: string;
  startDate: string;
  endDate: string;
  periods: Period[];
  sections: PnlNode[];
}

