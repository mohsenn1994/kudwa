import buildProfitAndLoss from '../src/etl/transform/buildProfitAndLoss';
import { NormalizedTransaction } from '../src/types/transaction';

function makeTransaction(overrides: Partial<NormalizedTransaction> & Pick<NormalizedTransaction, 'external_id' | 'amount' | 'pl_group'>): NormalizedTransaction {
  return {
    source: 'dataset_1',
    date: '2022-01-01',
    period_end: '2022-01-31',
    currency: 'USD',
    description: overrides.external_id,
    transaction_type: overrides.amount >= 0 ? 'credit' : 'debit',
    pl_category: 'other',
    raw_data: {},
    ...overrides,
  };
}

// A transaction covering all five P&L buckets
const baseTransactions: NormalizedTransaction[] = [
  makeTransaction({ external_id: 't1', amount: 10000, pl_group: 'Income',    description: 'Sales' }),
  makeTransaction({ external_id: 't2', amount: -3000, pl_group: 'COGS',      description: 'Materials', transaction_type: 'debit' }),
  makeTransaction({ external_id: 't3', amount: -2000, pl_group: 'Expenses',  description: 'Rent',      transaction_type: 'debit' }),
  makeTransaction({ external_id: 't4', amount:   500, pl_group: 'OtherIncome',    description: 'Interest income' }),
  makeTransaction({ external_id: 't5', amount:  -200, pl_group: 'OtherExpenses',  description: 'Bank fees', transaction_type: 'debit' }),
];

// -- Tests
describe('buildProfitAndLoss', () => {
  it('throws when given an empty transaction list', () => {
    expect(() => buildProfitAndLoss([])).toThrow();
  });

  it('calculates grossProfit = revenue − cogs', () => {
    const report = buildProfitAndLoss(baseTransactions);
    expect(report.totalRevenue).toBe(10000);
    expect(report.totalCogs).toBe(-3000);
    expect(report.grossProfit).toBe(10000 - (-3000)); // 13000
  });

  it('calculates netOperatingIncome = grossProfit − expenses', () => {
    const report = buildProfitAndLoss(baseTransactions);
    expect(report.netOperatingIncome).toBe(report.grossProfit - report.totalExpenses);
  });

  it('calculates netProfit = netOperatingIncome + otherIncome − otherExpenses', () => {
    const report = buildProfitAndLoss(baseTransactions);
    const expected = report.netOperatingIncome + report.totalOtherIncome - report.totalOtherExpenses;
    expect(report.netProfit).toBeCloseTo(expected);
  });

  it('derives periodStart and periodEnd from transaction dates', () => {
    const transactions = [
      makeTransaction({ external_id: 'a', amount: 100, pl_group: 'Income', date: '2021-06-01', period_end: '2021-06-30' }),
      makeTransaction({ external_id: 'b', amount: 100, pl_group: 'Income', date: '2022-12-01', period_end: '2022-12-31' }),
    ];
    const report = buildProfitAndLoss(transactions);
    expect(report.periodStart).toBe('2021-06-01');
    expect(report.periodEnd).toBe('2022-12-31');
  });

  it('returns a periodLabel formatted as "Mon YYYY – Mon YYYY"', () => {
    const report = buildProfitAndLoss(baseTransactions);
    expect(report.periodLabel).toMatch(/\w{3} \d{4} – \w{3} \d{4}/);
  });

  it('line items are sorted in waterfall order', () => {
    const report = buildProfitAndLoss(baseTransactions);
    const names = report.lineItems.map(li => li.name);
    // Revenue (0) → COGS (1) → Gross Profit (2) → Expenses (2) → ...
    expect(names.indexOf('Income')).toBeLessThan(names.indexOf('Gross Profit'));
    expect(names.indexOf('Gross Profit')).toBeLessThan(names.indexOf('Net Operating Income'));
    expect(names.indexOf('Net Operating Income')).toBeLessThan(names.indexOf('Net Income'));
  });

  it('includes Gross Profit, Net Operating Income, Net Other Income, and Net Income calculated rows', () => {
    const report = buildProfitAndLoss(baseTransactions);
    const calculatedNames = report.lineItems.filter(li => li.category === 'calculated').map(li => li.name);
    expect(calculatedNames).toContain('Gross Profit');
    expect(calculatedNames).toContain('Net Operating Income');
    expect(calculatedNames).toContain('Net Other Income');
    expect(calculatedNames).toContain('Net Income');
  });

  it('merges data_set_1 and data_set_2 transactions for the same bucket into a single section', () => {
    // DS1 uses 'Income', DS2 uses 'revenue' — both are the 'revenue' bucket
    const mixed = [
      makeTransaction({ external_id: 'ds1-t1', amount: 5000, pl_group: 'Income',   description: 'DS1 Sales',   source: 'dataset_1' }),
      makeTransaction({ external_id: 'ds2-t1', amount: 3000, pl_group: 'revenue',  description: 'DS2 Revenue', source: 'dataset_2' }),
    ];
    const report = buildProfitAndLoss(mixed);
    const revenueSections = report.lineItems.filter(li => li.pl_group === 'Income' || li.pl_group === 'revenue');
    // There should be exactly one "Income" section row (not two)
    expect(revenueSections).toHaveLength(1);
    expect(report.totalRevenue).toBe(8000);
  });

  it('filters zero-balance accounts from child line items', () => {
    const transactions = [
      makeTransaction({ external_id: 't1', amount: 5000, pl_group: 'Income', description: 'Sales' }),
      makeTransaction({ external_id: 't2', amount:    0, pl_group: 'Income', description: 'Returns' }),
    ];
    const report = buildProfitAndLoss(transactions);
    const incomeSection = report.lineItems.find(li => li.name === 'Income');
    expect(incomeSection?.children.every(c => c.amount !== 0)).toBe(true);
  });

  it('sets currency to USD', () => {
    const report = buildProfitAndLoss(baseTransactions);
    expect(report.currency).toBe('USD');
  });

  it('revenue-only waterfall — expense buckets are 0 and all calculated rows still present', () => {
    const transactions = [
      makeTransaction({ external_id: 't1', amount: 20000, pl_group: 'Income', description: 'Sales' }),
    ];
    const report = buildProfitAndLoss(transactions);
    expect(report.totalRevenue).toBe(20000);
    expect(report.totalCogs).toBe(0);
    expect(report.grossProfit).toBe(20000);
    expect(report.totalExpenses).toBe(0);
    expect(report.netOperatingIncome).toBe(20000);
    expect(report.totalOtherIncome).toBe(0);
    expect(report.totalOtherExpenses).toBe(0);
    expect(report.netProfit).toBe(20000);
    const calculatedNames = report.lineItems.filter(li => li.category === 'calculated').map(li => li.name);
    expect(calculatedNames).toContain('Gross Profit');
    expect(calculatedNames).toContain('Net Operating Income');
    expect(calculatedNames).toContain('Net Income');
  });

  it('netProfit is negative when COGS exceeds revenue', () => {
    // Positive COGS: grossProfit = revenue - cogs → negative when cogs > revenue
    const transactions = [
      makeTransaction({ external_id: 't1', amount: 1000, pl_group: 'Income', description: 'Sales' }),
      makeTransaction({ external_id: 't2', amount: 5000, pl_group: 'COGS',   description: 'Materials' }),
    ];
    const report = buildProfitAndLoss(transactions);
    expect(report.totalRevenue).toBe(1000);
    expect(report.totalCogs).toBe(5000);
    expect(report.grossProfit).toBe(1000 - 5000); // -4000
    expect(report.netProfit).toBeLessThan(0);
    expect(report.netProfit).toBe(-4000);
  });

  it('transactions from both datasets in every bucket combine correctly', () => {
    const mixed = [
      makeTransaction({ external_id: 'ds1-inc', amount:  8000, pl_group: 'Income', source: 'dataset_1' }),
      makeTransaction({ external_id: 'ds2-inc', amount:  2000, pl_group: 'revenue', source: 'dataset_2' }),
      makeTransaction({ external_id: 'ds1-cogs', amount: -1000, pl_group: 'COGS', source: 'dataset_1', transaction_type: 'debit' }),
      makeTransaction({ external_id: 'ds2-cogs', amount:  -500, pl_group: 'cost_of_goods_sold', source: 'dataset_2', transaction_type: 'debit' }),
      makeTransaction({ external_id: 'ds1-exp', amount:  -800, pl_group: 'Expenses', source: 'dataset_1', transaction_type: 'debit' }),
      makeTransaction({ external_id: 'ds2-exp', amount:  -200, pl_group: 'operating_expenses', source: 'dataset_2', transaction_type: 'debit' }),
    ];
    const report = buildProfitAndLoss(mixed);
    expect(report.totalRevenue).toBe(10000);
    expect(report.totalCogs).toBe(-1500);
    expect(report.grossProfit).toBe(10000 - (-1500)); // 11500
    expect(report.totalExpenses).toBe(-1000);
    expect(report.netOperatingIncome).toBe(report.grossProfit - report.totalExpenses);
    // Revenue and COGS from both datasets should merge into a single section each
    const incomeRows = report.lineItems.filter(li => li.name === 'Income');
    expect(incomeRows).toHaveLength(1);
    const cogsRows = report.lineItems.filter(li => li.name === 'Cost of Goods Sold');
    expect(cogsRows).toHaveLength(1);
  });
});
