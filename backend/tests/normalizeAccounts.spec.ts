import normalizeAccounts from '../src/etl/transform/normalizeAccounts';

// -- Dataset 1 mock data
const ds1WithSingleAccount = {
  data: {
    Header: { Currency: 'USD' },
    Columns: { Column: [] },
    Rows: {
      Row: [
        {
          type: 'Section',
          group: 'Income',
          Header: { ColData: [{ value: 'Income' }] },
          Rows: {
            Row: [
              { type: 'Data', ColData: [{ id: '100', value: 'Sales Revenue' }] },
            ],
          },
        },
      ],
    },
  },
};

const ds1WithNestedSection = {
  data: {
    Header: { Currency: 'USD' },
    Columns: { Column: [] },
    Rows: {
      Row: [
        {
          type: 'Section',
          group: 'Income',
          Header: { ColData: [{ value: 'Income' }] },
          Rows: {
            Row: [
              {
                type: 'Section',
                Header: { ColData: [{ value: 'Product Sales' }] },
                Rows: {
                  Row: [
                    { type: 'Data', ColData: [{ id: '101', value: 'Widget Sales' }] },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  },
};

const ds1WithNoIdRow = {
  data: {
    Header: { Currency: 'USD' },
    Columns: { Column: [] },
    Rows: {
      Row: [
        {
          type: 'Section',
          group: 'Expenses',
          Header: { ColData: [{ value: 'Expenses' }] },
          Rows: {
            Row: [
              // Row with id → keep
              { type: 'Data', ColData: [{ id: '200', value: 'Rent' }] },
              // Row without id (total row) → skip
              { type: 'Data', ColData: [{ value: 'Total Expenses' }] },
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
            { account_id: 'acc-001', name: 'Product Sales', value: '5000', line_items: [] },
          ],
        },
      ],
    },
    {
      // Second period has the same account — should be deduplicated
      period_start: '2022-09-01',
      period_end: '2022-09-30',
      revenue: [
        {
          name: 'Business Revenue',
          line_items: [
            { account_id: 'acc-001', name: 'Product Sales', value: '6000', line_items: [] },
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
              value: '1000',
              line_items: [
                { account_id: 'acc-011', name: 'Technical Consulting', value: '600', line_items: [] },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// -- Tests
describe('normalizeAccounts — dataset_1', () => {
  it('returns one account per leaf row', () => {
    const accounts = normalizeAccounts(ds1WithSingleAccount, 'dataset_1');
    expect(accounts).toHaveLength(1);
    expect(accounts[0].external_id).toBe('dataset_1__100');
    expect(accounts[0].name).toBe('Sales Revenue');
    expect(accounts[0].pl_group).toBe('Income');
    expect(accounts[0].account_type).toBe('revenue');
    expect(accounts[0].source).toBe('dataset_1');
  });

  it('skips leaf rows that have no account id', () => {
    const accounts = normalizeAccounts(ds1WithNoIdRow, 'dataset_1');
    expect(accounts).toHaveLength(1);
    expect(accounts[0].external_id).toBe('dataset_1__200');
  });

  it('inherits pl_group from the enclosing section', () => {
    const accounts = normalizeAccounts(ds1WithSingleAccount, 'dataset_1');
    expect(accounts[0].pl_group).toBe('Income');
  });

  it('assigns correct parent_external_id for nested sections', () => {
    const accounts = normalizeAccounts(ds1WithNestedSection, 'dataset_1');
    expect(accounts).toHaveLength(1);
    // The leaf sits inside a nested "Product Sales" section whose id includes the parent group
    expect(accounts[0].parent_external_id).toMatch(/dataset_1__section__Income/);
    expect(accounts[0].depth).toBeGreaterThan(0);
  });

  it('throws on data nested deeper than 20 levels', () => {
    // Build a pathologically deep nesting
    function buildDeep(depth: number): object {
      if (depth === 0) return { type: 'Data', ColData: [{ id: 'x', value: 'x' }] };
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
        Columns: { Column: [] },
        Rows: { Row: [buildDeep(25)] },
      },
    };
    expect(() => normalizeAccounts(deepFixture, 'dataset_1')).toThrow(/depth/i);
  });
});

describe('normalizeAccounts — dataset_2', () => {
  it('returns one account per unique account_id', () => {
    const accounts = normalizeAccounts(ds2TwoPeriods, 'dataset_2');
    // Both period records contain the same account; only one should appear
    expect(accounts).toHaveLength(1);
    expect(accounts[0].external_id).toBe('dataset_2__acc-001');
  });

  it('sets correct source and pl_group', () => {
    const accounts = normalizeAccounts(ds2TwoPeriods, 'dataset_2');
    expect(accounts[0].source).toBe('dataset_2');
    expect(accounts[0].pl_group).toBe('revenue');
    expect(accounts[0].account_type).toBe('revenue');
  });

  it('registers both parent and child accounts', () => {
    const accounts = normalizeAccounts(ds2Nested, 'dataset_2');
    expect(accounts).toHaveLength(2);
    const parent = accounts.find(a => a.external_id === 'dataset_2__acc-010');
    const child = accounts.find(a => a.external_id === 'dataset_2__acc-011');
    expect(parent).toBeDefined();
    expect(child).toBeDefined();
    expect(child!.parent_external_id).toBe('dataset_2__acc-010');
    expect(child!.depth).toBe(1);
  });

  it('returns an empty array when data is empty', () => {
    const accounts = normalizeAccounts({ data: [] }, 'dataset_2');
    expect(accounts).toEqual([]);
  });
});

describe('normalizeAccounts — unknown source', () => {
  it('throws for an unrecognised source name', () => {
    expect(() => normalizeAccounts({}, 'dataset_3')).toThrow('Unknown source');
  });
});

describe('normalizeAccounts — additional edge cases', () => {
  it('DS1: registers all sibling accounts in the same section', () => {
    const ds1MultipleAccounts = {
      data: {
        Header: { Currency: 'USD' },
        Columns: { Column: [] },
        Rows: {
          Row: [
            {
              type: 'Section',
              group: 'Income',
              Header: { ColData: [{ value: 'Income' }] },
              Rows: {
                Row: [
                  { type: 'Data', ColData: [{ id: '100', value: 'Sales' }] },
                  { type: 'Data', ColData: [{ id: '101', value: 'Services' }] },
                  { type: 'Data', ColData: [{ id: '102', value: 'Consulting' }] },
                ],
              },
            },
          ],
        },
      },
    };
    const accounts = normalizeAccounts(ds1MultipleAccounts, 'dataset_1');
    expect(accounts).toHaveLength(3);
    expect(accounts.map(a => a.external_id)).toEqual(
      expect.arrayContaining(['dataset_1__100', 'dataset_1__101', 'dataset_1__102'])
    );
  });

  it('DS2: includes all accounts from the first period even if absent in later periods', () => {
    const ds2Asymmetric = {
      data: [
        {
          period_start: '2022-08-01',
          period_end: '2022-08-31',
          revenue: [
            {
              name: 'Business Revenue',
              line_items: [
                { account_id: 'acc-001', name: 'Product Sales', value: '5000', line_items: [] },
                { account_id: 'acc-002', name: 'Service Sales', value: '1000', line_items: [] },
              ],
            },
          ],
        },
        {
          // Second period — acc-002 missing, but accounts are derived from first period only
          period_start: '2022-09-01',
          period_end: '2022-09-30',
          revenue: [
            {
              name: 'Business Revenue',
              line_items: [
                { account_id: 'acc-001', name: 'Product Sales', value: '6000', line_items: [] },
              ],
            },
          ],
        },
      ],
    };
    const accounts = normalizeAccounts(ds2Asymmetric, 'dataset_2');
    expect(accounts).toHaveLength(2);
    expect(accounts.map(a => a.external_id)).toEqual(
      expect.arrayContaining(['dataset_2__acc-001', 'dataset_2__acc-002'])
    );
  });

  it('DS2: throws when line items are nested deeper than 20 levels', () => {
    function buildDeepItems(depth: number): object {
      if (depth === 0) return { account_id: 'acc-leaf', name: 'Leaf', value: '100', line_items: [] };
      return { account_id: `acc-${depth}`, name: `Level ${depth}`, value: '100', line_items: [buildDeepItems(depth - 1)] };
    }
    const deepFixture = {
      data: [
        {
          period_start: '2022-08-01',
          period_end: '2022-08-31',
          revenue: [{ name: 'Revenue', line_items: [buildDeepItems(25)] }],
        },
      ],
    };
    expect(() => normalizeAccounts(deepFixture, 'dataset_2')).toThrow(/depth/i);
  });
});
