/* 
    Aggregate the merged transaction list into a structured P&L report.
    This is the final transform step — it takes flat, normalised transactions and
    produces the financial waterfall (Revenue → COGS → Gross Profit → Expenses →
    Net Operating Income → Other Income/Expenses → Net Income) along with the
    line items needed to render the full report.
*/

/* 
    The process has four steps:
       1. Derive the date range from the transactions themselves.
       2. Group transactions by P&L group and accumulate amounts per account.
       3. Run the waterfall calculations (all the computed subtotals).
       4. Build the line item tree (sections with account children) and append
          the calculated rows at the correct sort positions.
*/

import { ProfitLossData, ProfitLossLineItem } from '../../types/profitAndLoss';
import { NormalizedTransaction } from '../../types/transaction';
import logger from '../../config/logger';

/* 
    Maps each raw group name to one of five canonical P&L buckets.
    Both data_set_1 (PascalCase) and data_set_2 (snake_case) names map to the same bucket,
    which allows us to combine their transactions into a single section.
*/
const GROUP_TO_BUCKET: Record<string, string> = {
  Income: 'revenue',
  COGS: 'cogs',
  Expenses: 'expenses',
  OtherIncome: 'otherIncome',
  OtherExpenses: 'otherExpenses',
  revenue: 'revenue',
  cost_of_goods_sold: 'cogs',
  operating_expenses: 'expenses',
  non_operating_revenue: 'otherIncome',
  non_operating_expenses: 'otherExpenses',
};

/* 
    Human-readable section labels for the rendered report. Both data_set_1 and data_set_2
    names for the same bucket share the same display name.
*/
const GROUP_DISPLAY_NAMES: Record<string, string> = {
  Income: 'Income',
  revenue: 'Income',
  COGS: 'Cost of Goods Sold',
  cost_of_goods_sold: 'Cost of Goods Sold',
  Expenses: 'Expenses',
  operating_expenses: 'Expenses',
  OtherIncome: 'Other Income',
  non_operating_revenue: 'Other Income',
  OtherExpenses: 'Other Expenses',
  non_operating_expenses: 'Other Expenses',
};

/* 
    Controls the display order of the P&L report. The five data sections (0–4)
    are interlaced with calculated rows added later at positions 2, 5, 8, 9:
       0 Revenue → 1 COGS → [2 Gross Profit] → 2 Expenses → 3 Other Income →
       4 Other Expenses → [5 Net Op. Income] → [8 Net Other Income] → [9 Net Income]
*/
const SORT_ORDER: Record<string, number> = {
  Income: 0,
  revenue: 0,
  COGS: 1,
  cost_of_goods_sold: 1,
  Expenses: 2,
  operating_expenses: 2,
  OtherIncome: 3,
  non_operating_revenue: 3,
  OtherExpenses: 4,
  non_operating_expenses: 4,
};

function buildProfitAndLoss(transactions: NormalizedTransaction[]): ProfitLossData {
  logger.info('Building P&L report', { transactionCount: transactions.length });

  if (!transactions.length) {
    throw new Error('Cannot build P&L report — no transactions loaded');
  }

  // -- Step 1: Derive the report date range
  // Rather than accepting dates as parameters, we derive them from the actual transaction data.
  const dates = transactions.map(t => t.date).filter(Boolean).sort();
  const periodStart = dates[0];
  const periodEnd = transactions
    .map(t => t.period_end || t.date)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  // -- Step 2: Group transactions
  // Accumulate transaction amounts into: grouped[plGroup][accountName] = total.
  const grouped: Record<string, Record<string, number>> = {};

  transactions.forEach(t => {
    const group = t.pl_group;
    // Transactions with an unrecognised group are skipped
    if (!group || GROUP_TO_BUCKET[group] === undefined) return;

    if (!grouped[group]) grouped[group] = {};

    // Use description as the account label, falling back to external_id.
    // This is what appears as the child row name in the rendered report.
    const key = t.description || t.external_id;
    grouped[group][key] = (grouped[group][key] || 0) + parseFloat(String(t.amount));
  });

  // -- Step 3: Waterfall calculations
  // Each line sums both the data_set_1 and data_set_2 group names for the same bucket.
  // For example, totalRevenue adds 'Income' (data_set_1) and 'revenue' (data_set_2).
  const sumGroup = (group: string): number =>
    Object.values(grouped[group] || {}).reduce((s, v) => s + v, 0);

  const totalRevenue         = sumGroup('Income')       + sumGroup('revenue');
  const totalCogs            = sumGroup('COGS')         + sumGroup('cost_of_goods_sold');
  const grossProfit          = totalRevenue - totalCogs;
  const totalExpenses        = sumGroup('Expenses')     + sumGroup('operating_expenses');
  const netOperatingIncome   = grossProfit - totalExpenses;
  const totalOtherIncome     = sumGroup('OtherIncome')  + sumGroup('non_operating_revenue');
  const totalOtherExpenses   = sumGroup('OtherExpenses') + sumGroup('non_operating_expenses');
  const netProfit            = netOperatingIncome + totalOtherIncome - totalOtherExpenses;

  logger.info('P&L waterfall calculated', {
    totalRevenue,
    totalCogs,
    grossProfit,
    totalExpenses,
    netOperatingIncome,
    totalOtherIncome,
    totalOtherExpenses,
    netProfit,
  });

  // -- Step 4: Build the line item tree
  // Each entry in `grouped` becomes one section row (depth 0) with the individual accounts as its children (depth 1).
  
  /* 
    The processedBuckets Set prevents creating two separate section rows when
    data_set_1 and data_set_2 both have data for the same canonical bucket. For example,
    'Income' (data_set_1) and 'revenue' (data_set_2) both map to the 'revenue' bucket —
    without this guard we'd emit two "Income" sections in the report.
  */
  const lineItems: ProfitLossLineItem[] = [];
  const processedBuckets = new Set<string>();

  Object.entries(grouped).forEach(([group, accounts]) => {
    const bucket = GROUP_TO_BUCKET[group];
    if (!bucket || processedBuckets.has(bucket)) return;
    processedBuckets.add(bucket);

    // Merge accounts from all groups that share this bucket
    const mergedAccounts: Record<string, number> = {};
    Object.entries(grouped).forEach(([g, accts]) => {
      if (GROUP_TO_BUCKET[g] === bucket) {
        Object.entries(accts).forEach(([name, amount]) => {
          mergedAccounts[name] = (mergedAccounts[name] || 0) + amount;
        });
      }
    });

    const sectionTotal = Object.values(mergedAccounts).reduce((s, v) => s + v, 0);
    const displayName = GROUP_DISPLAY_NAMES[group] || group;
    const sortOrder = SORT_ORDER[group] ?? 99;

    // Zero-balance accounts are filtered out to keep the report clean.
    const children: ProfitLossLineItem[] = Object.entries(mergedAccounts)
      .filter(([, amount]) => amount !== 0)
      .map(([name, amount], i) => ({
        name,
        category: GROUP_TO_BUCKET[group] === 'revenue' ? 'revenue' : 'expense',
        pl_group: group,
        amount,
        depth: 1,
        sort_order: i,
        period_start: periodStart,
        period_end: periodEnd,
        children: [],
      }));

    lineItems.push({
      name: displayName,
      category: GROUP_TO_BUCKET[group] === 'revenue' ? 'revenue' : 'expense',
      pl_group: group,
      amount: sectionTotal,
      depth: 0,
      sort_order: sortOrder,
      period_start: periodStart,
      period_end: periodEnd,
      children,
    });
  });

  // Calculated rows are derived from the waterfall above
  const calculatedRows: ProfitLossLineItem[] = [
    {
      name: 'Gross Profit',
      category: 'calculated',
      pl_group: 'GrossProfit',
      amount: grossProfit,
      depth: 0,
      sort_order: 2, // after Revenue (0) and COGS (1)
      period_start: periodStart,
      period_end: periodEnd,
      children: [],
    },
    {
      name: 'Net Operating Income',
      category: 'calculated',
      pl_group: 'NetOperatingIncome',
      amount: netOperatingIncome,
      depth: 0,
      sort_order: 5, // after Expenses (2), Other Income (3), Other Expenses (4)
      period_start: periodStart,
      period_end: periodEnd,
      children: [],
    },
    {
      name: 'Net Other Income',
      category: 'calculated',
      pl_group: 'NetOtherIncome',
      amount: totalOtherIncome - totalOtherExpenses,
      depth: 0,
      sort_order: 8,
      period_start: periodStart,
      period_end: periodEnd,
      children: [],
    },
    {
      name: 'Net Income',
      category: 'calculated',
      pl_group: 'NetIncome',
      amount: netProfit,
      depth: 0,
      sort_order: 9, // always last
      period_start: periodStart,
      period_end: periodEnd,
      children: [],
    },
  ];

  lineItems.push(...calculatedRows);
  lineItems.sort((a, b) => a.sort_order - b.sort_order);

  logger.info('P&L report built', {
    sections: lineItems.filter(li => li.depth === 0).length,
    periodStart,
    periodEnd,
  });

  return {
    periodStart,
    periodEnd,
    periodLabel: `${formatDate(periodStart)} – ${formatDate(periodEnd)}`,
    currency: 'USD',
    totalRevenue,
    totalCogs,
    grossProfit,
    totalExpenses,
    netOperatingIncome,
    totalOtherIncome,
    totalOtherExpenses,
    netProfit,
    lineItems,
  };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export default buildProfitAndLoss;
