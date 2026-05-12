// Maps P&L group names from both datasets to canonical account categories.
// Dataset 1 uses QuickBooks-style PascalCase; dataset 2 uses snake_case.
// Shared across normalizeAccounts and normalizeTransactions.
export const GROUP_TO_CATEGORY: Record<string, string> = {
  Income: 'revenue',
  OtherIncome: 'revenue',
  COGS: 'expense',
  Expenses: 'expense',
  OtherExpenses: 'expense',
  GrossProfit: 'calculated',
  NetOperatingIncome: 'calculated',
  NetOtherIncome: 'calculated',
  NetIncome: 'calculated',
  revenue: 'revenue',
  non_operating_revenue: 'revenue',
  cost_of_goods_sold: 'expense',
  operating_expenses: 'expense',
  non_operating_expenses: 'expense',
};

// The five top-level P&L category fields present in every dataset 2 record.
// Shared across normalizeAccounts and normalizeTransactions.
export const DATASET2_CATEGORY_FIELDS = [
  'revenue',
  'cost_of_goods_sold',
  'operating_expenses',
  'non_operating_revenue',
  'non_operating_expenses',
] as const;

export type Dataset2CategoryField = typeof DATASET2_CATEGORY_FIELDS[number];
