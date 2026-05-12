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
});
