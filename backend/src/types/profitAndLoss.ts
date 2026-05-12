import { z } from 'zod';
import type { NormalizedAccount } from './account';
import type { NormalizedTransaction } from './transaction';

// ProfitLossLineItem is recursive (children: ProfitLossLineItem[]) so the TS
// type must be declared before the schema so z.lazy can reference it.
export type ProfitLossLineItem = {
  name: string;
  category: string;
  pl_group: string;
  amount: number;
  depth: number;
  sort_order: number;
  period_start: string;
  period_end: string;
  children: ProfitLossLineItem[];
};

export const ProfitLossLineItemSchema: z.ZodType<ProfitLossLineItem> = z.lazy(() =>
  z.object({
    name: z.string(),
    category: z.string(),
    pl_group: z.string(),
    amount: z.number(),
    depth: z.number().int(),
    sort_order: z.number().int(),
    period_start: z.string(),
    period_end: z.string(),
    children: z.array(ProfitLossLineItemSchema),
  })
);

export const ProfitLossDataSchema = z.object({
  periodStart: z.string(),
  periodEnd: z.string(),
  periodLabel: z.string(),
  currency: z.string(),
  totalRevenue: z.number(),
  totalCogs: z.number(),
  grossProfit: z.number(),
  totalExpenses: z.number(),
  netOperatingIncome: z.number(),
  totalOtherIncome: z.number(),
  totalOtherExpenses: z.number(),
  netProfit: z.number(),
  lineItems: z.array(ProfitLossLineItemSchema),
});

export type ProfitLossData = z.infer<typeof ProfitLossDataSchema>;

export interface MergedSources {
  accounts: NormalizedAccount[];
  transactions: NormalizedTransaction[];
}
