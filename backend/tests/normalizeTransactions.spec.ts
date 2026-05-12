import normalizeTransactions from '../src/etl/transform/normalizeTransactions';

// -- Dataset 1 mock data
// Two Money columns → each leaf account should emit two transactions
const ds1TwoPeriods = {
  data: {
    Header: { Currency: 'USD' },
    Columns: {
      Column: [
        // Col 0: account label column (not Money)
        { ColType: 'Account', ColTitle: '', MetaData: [{ Name: 'ColKey', Value: 'account' }] },
        // Col 1: Jan 2022
        {
          ColType: 'Money',
          ColTitle: 'Jan 2022',
          MetaData: [
            { Name: 'StartDate', Value: '2022-01-01' },
            { Name: 'EndDate', Value: '2022-01-31' },
            { Name: 'ColKey', Value: 'Jan 2022' },
          ],
        },
        // Col 2: Feb 2022
        {
          ColType: 'Money',
          ColTitle: 'Feb 2022',
          MetaData: [
            { Name: 'StartDate', Value: '2022-02-01' },
            { Name: 'EndDate', Value: '2022-02-28' },
            { Name: 'ColKey', Value: 'Feb 2022' },
          ],
        },
      ],
    },
    Rows: {
      Row: [
        {
          type: 'Section',
          group: 'Income',
          Header: { ColData: [{ value: 'Income' }] },
          Rows: {
            Row: [
              {
                type: 'Data',
                ColData: [
                  { id: '100', value: 'Sales Revenue' },
                  { value: '5000.00' }, // Jan amount
                  { value: '6000.00' }, // Feb amount
                ],
              },
            ],
          },
        },
      ],
    },
  },
};

// Money column without StartDate should be treated as a total column and skipped
const ds1WithTotalColumn = {
  data: {
    Header: { Currency: 'USD' },
    Columns: {
      Column: [
        { ColType: 'Account', ColTitle: '' },
        {
          ColType: 'Money',
          ColTitle: 'Jan 2022',
          MetaData: [
            { Name: 'StartDate', Value: '2022-01-01' },
            { Name: 'EndDate', Value: '2022-01-31' },
          ],
        },
        // Total column: Money but no StartDate → should be skipped
        {
          ColType: 'Money',
          ColTitle: 'Total',
          MetaData: [{ Name: 'ColKey', Value: 'total' }],
        },
      ],
    },
    Rows: {
      Row: [
        {
          type: 'Section',
          group: 'Income',
          Header: { ColData: [{ value: 'Income' }] },
          Rows: {
            Row: [
              {
                type: 'Data',
                ColData: [
                  { id: '100', value: 'Sales' },
                  { value: '5000.00' },
                  { value: '5000.00' }, // total column — should not emit a transaction
                ],
              },
            ],
          },
        },
      ],
    },
  },
};

// Leaf row without an account id should be skipped (total/summary row)
const ds1WithSummaryRow = {
  data: {
    Header: { Currency: 'USD' },
    Columns: {
      Column: [
        { ColType: 'Account', ColTitle: '' },
        {
          ColType: 'Money',
          ColTitle: 'Jan 2022',
          MetaData: [
            { Name: 'StartDate', Value: '2022-01-01' },
            { Name: 'EndDate', Value: '2022-01-31' },
          ],
        },
      ],
    },
    Rows: {
      Row: [
        {
          type: 'Section',
          group: 'Income',
          Header: { ColData: [{ value: 'Income' }] },
          Rows: {
            Row: [
              // Real account
              { type: 'Data', ColData: [{ id: '100', value: 'Sales' }, { value: '5000.00' }] },
              // Summary row (no id) — should be skipped
              { type: 'Data', ColData: [{ value: 'Total Income' }, { value: '5000.00' }] },
            ],
          },
        },
      ],
    },
  },
};

// -- Dataset 2 mock data
const ds2TwoPeriods = {
  data: [
    {
      period_start: '2022-08-01',
      period_end: '2022-08-31',
      revenue: [
        {
          name: 'Business Revenue',
          line_items: [
            { account_id: 'acc-001', name: 'Product Sales', value: 5000, line_items: [] },
          ],
        },
      ],
    },
    {
      period_start: '2022-09-01',
      period_end: '2022-09-30',
      revenue: [
        {
          name: 'Business Revenue',
          line_items: [
            { account_id: 'acc-001', name: 'Product Sales', value: 6000, line_items: [] },
          ],
        },
      ],
    },
  ],
};

const ds2Nested = {
  data: [
    {
      period_start: '2022-08-01',
      period_end: '2022-08-31',
      revenue: [
        {
          name: 'Business Revenue',
          line_items: [
            {
              account_id: 'acc-010',
              name: 'Consulting',
              value: 1000,
              line_items: [
                { account_id: 'acc-011', name: 'Technical Consulting', value: 600, line_items: [] },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// -- Tests

describe('normalizeTransactions — dataset_1', () => {
  it('emits one transaction per period per leaf account', () => {
    const transactions = normalizeTransactions(ds1TwoPeriods, 'dataset_1');
    expect(transactions).toHaveLength(2);
  });

  it('assigns correct external_id using account id and period start', () => {
    const transactions = normalizeTransactions(ds1TwoPeriods, 'dataset_1');
    const ids = transactions.map(t => t.external_id);
    expect(ids).toContain('dataset_1__100__2022-01-01');
    expect(ids).toContain('dataset_1__100__2022-02-01');
  });

  it('sets amount, source, date, and pl_group correctly', () => {
    const transactions = normalizeTransactions(ds1TwoPeriods, 'dataset_1');
    const jan = transactions.find(t => t.date === '2022-01-01')!;
    expect(jan.amount).toBe(5000);
    expect(jan.source).toBe('dataset_1');
    expect(jan.pl_group).toBe('Income');
    expect(jan.currency).toBe('USD');
  });

  it('skips Money columns that have no StartDate (total columns)', () => {
    const transactions = normalizeTransactions(ds1WithTotalColumn, 'dataset_1');
    // Only the Jan column should produce a transaction, not the Total column
    expect(transactions).toHaveLength(1);
    expect(transactions[0].date).toBe('2022-01-01');
  });

  it('skips leaf rows with no account id', () => {
    const transactions = normalizeTransactions(ds1WithSummaryRow, 'dataset_1');
    expect(transactions).toHaveLength(1);
    expect(transactions[0].external_id).toBe('dataset_1__100__2022-01-01');
  });

  it('labels positive amounts as credit and negative as debit', () => {
    const transactions = normalizeTransactions(ds1TwoPeriods, 'dataset_1');
    expect(transactions[0].transaction_type).toBe('credit');

    const ds1Negative = JSON.parse(JSON.stringify(ds1TwoPeriods));
    ds1Negative.data.Rows.Row[0].Rows.Row[0].ColData[1].value = '-1000.00';
    const negtransactions = normalizeTransactions(ds1Negative, 'dataset_1');
    expect(negtransactions.find(t => t.amount < 0)?.transaction_type).toBe('debit');
  });
});

describe('normalizeTransactions — dataset_2', () => {
  it('emits one transaction per period per account', () => {
    const transactions = normalizeTransactions(ds2TwoPeriods, 'dataset_2');
    // Same account in two periods → two transactions
    expect(transactions).toHaveLength(2);
  });

  it('uses period_start as the date', () => {
    const transactions = normalizeTransactions(ds2TwoPeriods, 'dataset_2');
    const dates = transactions.map(t => t.date).sort();
    expect(dates).toEqual(['2022-08-01', '2022-09-01']);
  });

  it('assigns correct external_id: dataset_2__accountId__periodStart', () => {
    const transactions = normalizeTransactions(ds2TwoPeriods, 'dataset_2');
    const ids = transactions.map(t => t.external_id);
    expect(ids).toContain('dataset_2__acc-001__2022-08-01');
    expect(ids).toContain('dataset_2__acc-001__2022-09-01');
  });

  it('emits only the leaf transaction, not the parent rollup', () => {
    const transactions = normalizeTransactions(ds2Nested, 'dataset_2');
    // acc-010 is a rollup (has children) — only leaf acc-011 should emit
    expect(transactions).toHaveLength(1);
    expect(transactions[0].external_id).toBe('dataset_2__acc-011__2022-08-01');
  });

  it('coerces numeric value to an amount', () => {
    const transactions = normalizeTransactions(ds2TwoPeriods, 'dataset_2');
    const aug = transactions.find(t => t.date === '2022-08-01')!;
    expect(aug.amount).toBe(5000);
  });
});

describe('normalizeTransactions — unknown source', () => {
  it('throws for an unrecognised source name', () => {
    expect(() => normalizeTransactions({}, 'dataset_3')).toThrow('Unknown source');
  });
});

describe('normalizeTransactions — additional edge cases', () => {
  it('DS1: emits a zero-amount transaction (zero filtering happens downstream in buildProfitAndLoss)', () => {
    const ds1WithZero = {
      data: {
        Header: { Currency: 'USD' },
        Columns: {
          Column: [
            { ColType: 'Account', ColTitle: '' },
            { ColType: 'Money', ColTitle: 'Jan 2022', MetaData: [{ Name: 'StartDate', Value: '2022-01-01' }, { Name: 'EndDate', Value: '2022-01-31' }] },
          ],
        },
        Rows: {
          Row: [
            {
              type: 'Section',
              group: 'Income',
              Header: { ColData: [{ value: 'Income' }] },
              Rows: {
                Row: [{ type: 'Data', ColData: [{ id: '100', value: 'Sales' }, { value: '0.00' }] }],
              },
            },
          ],
        },
      },
    };
    const txns = normalizeTransactions(ds1WithZero, 'dataset_1');
    expect(txns).toHaveLength(1);
    expect(txns[0].amount).toBe(0);
  });

  it('DS2: skips grouping nodes with no account_id and recurses into their children', () => {
    const ds2WithGroupingNode = {
      data: [
        {
          period_start: '2022-08-01',
          period_end: '2022-08-31',
          revenue: [
            {
              name: 'Business Revenue',
              line_items: [
                {
                  name: 'Services',
                  value: 1000,
                  line_items: [
                    { account_id: 'acc-020', name: 'Consulting', value: 800, line_items: [] },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const txns = normalizeTransactions(ds2WithGroupingNode, 'dataset_2');
    expect(txns).toHaveLength(1);
    expect(txns[0].external_id).toBe('dataset_2__acc-020__2022-08-01');
  });

  it('DS1: throws when the row tree exceeds 20 levels deep', () => {
    function buildDeep(depth: number): object {
      if (depth === 0) return { type: 'Data', ColData: [{ id: 'x', value: 'x' }, { value: '100.00' }] };
      return {
        type: 'Section',
        group: 'Income',
        Header: { ColData: [{ value: 'S' }] },
        Rows: { Row: [buildDeep(depth - 1)] },
      };
    }
    const deepFixture = {
      data: {
        Header: { Currency: 'USD' },
        Columns: {
          Column: [
            { ColType: 'Account', ColTitle: '' },
            { ColType: 'Money', ColTitle: 'Jan 2022', MetaData: [{ Name: 'StartDate', Value: '2022-01-01' }, { Name: 'EndDate', Value: '2022-01-31' }] },
          ],
        },
        Rows: { Row: [buildDeep(25)] },
      },
    };
    expect(() => normalizeTransactions(deepFixture, 'dataset_1')).toThrow(/depth/i);
  });
});
