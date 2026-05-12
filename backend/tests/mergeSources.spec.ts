import mergeSources from '../src/etl/transform/mergeSources';
import { NormalizedAccount } from '../src/types/account';
import { NormalizedTransaction } from '../src/types/transaction';

function makeAccount(id: string, source = 'dataset_1'): NormalizedAccount {
  return {
    external_id: id,
    source,
    name: id,
    account_type: 'revenue',
    pl_group: 'Income',
    currency: 'USD',
    depth: 0,
    parent_external_id: null,
    raw_data: {},
  };
}

function makeTransaction(id: string, source = 'dataset_1'): NormalizedTransaction {
  return {
    external_id: id,
    source,
    date: '2022-01-01',
    period_end: '2022-01-31',
    amount: 100,
    currency: 'USD',
    description: id,
    transaction_type: 'credit',
    pl_group: 'Income',
    pl_category: 'revenue',
    raw_data: {},
  };
}

// -- Tests
describe('mergeSources', () => {
  it('preserves all records when there are no id collisions', () => {
    const result = mergeSources(
      {
        accounts: [makeAccount('dataset_1__acc-a'), makeAccount('dataset_1__acc-b')],
        transactions: [makeTransaction('dataset_1__t1'), makeTransaction('dataset_1__t2')],
      },
      {
        accounts: [makeAccount('dataset_2__acc-x', 'dataset_2')],
        transactions: [makeTransaction('dataset_2__t3', 'dataset_2')],
      }
    );

    expect(result.accounts).toHaveLength(3);
    expect(result.transactions).toHaveLength(3);
  });

  it('deduplicates records with the same external_id — dataset_2 wins', () => {
    const ds1Account = makeAccount('shared-id', 'dataset_1');
    ds1Account.name = 'DS1 version';
    const ds2Account = makeAccount('shared-id', 'dataset_2');
    ds2Account.name = 'DS2 version';

    const result = mergeSources(
      { accounts: [ds1Account], transactions: [] },
      { accounts: [ds2Account], transactions: [] }
    );

    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0].name).toBe('DS2 version');
  });

  it('deduplicates transactions the same way — dataset_2 wins on collision', () => {
    const ds1transaction = makeTransaction('shared-transaction-id', 'dataset_1');
    ds1transaction.amount = 100;
    const ds2transaction = makeTransaction('shared-transaction-id', 'dataset_2');
    ds2transaction.amount = 999;

    const result = mergeSources(
      { accounts: [], transactions: [ds1transaction] },
      { accounts: [], transactions: [ds2transaction] }
    );

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].amount).toBe(999);
  });

  it('handles both sources being empty', () => {
    const result = mergeSources(
      { accounts: [], transactions: [] },
      { accounts: [], transactions: [] }
    );
    expect(result.accounts).toHaveLength(0);
    expect(result.transactions).toHaveLength(0);
  });

  it('handles one source being empty', () => {
    const result = mergeSources(
      {
        accounts: [makeAccount('dataset_1__a')],
        transactions: [makeTransaction('dataset_1__t')],
      },
      { accounts: [], transactions: [] }
    );
    expect(result.accounts).toHaveLength(1);
    expect(result.transactions).toHaveLength(1);
  });

  it('preserves all fields on merged records', () => {
    const account = makeAccount('dataset_1__full');
    account.pl_group = 'COGS';
    account.depth = 2;
    account.parent_external_id = 'dataset_1__parent';

    const result = mergeSources(
      { accounts: [account], transactions: [] },
      { accounts: [], transactions: [] }
    );

    expect(result.accounts[0].pl_group).toBe('COGS');
    expect(result.accounts[0].depth).toBe(2);
    expect(result.accounts[0].parent_external_id).toBe('dataset_1__parent');
  });

  it('deduplicates many collisions at once — dataset_2 always wins', () => {
    const sharedIds = ['id-1', 'id-2', 'id-3', 'id-4', 'id-5'];
    const ds1Accounts = sharedIds.map(id => {
      const a = makeAccount(id, 'dataset_1');
      a.name = `dataset_1 ${id}`;
      return a;
    });
    const ds2Accounts = sharedIds.map(id => {
      const a = makeAccount(id, 'dataset_2');
      a.name = `dataset_2 ${id}`;
      return a;
    });
    const ds1Transactions = sharedIds.map(id => {
      const t = makeTransaction(id, 'dataset_1');
      t.amount = 100;
      return t;
    });
    const ds2Transactions = sharedIds.map(id => {
      const t = makeTransaction(id, 'dataset_2');
      t.amount = 999;
      return t;
    });

    const result = mergeSources(
      { accounts: ds1Accounts, transactions: ds1Transactions },
      { accounts: ds2Accounts, transactions: ds2Transactions }
    );

    expect(result.accounts).toHaveLength(5);
    expect(result.transactions).toHaveLength(5);
    expect(result.accounts.every(a => a.name.startsWith('dataset_2'))).toBe(true);
    expect(result.transactions.every(t => t.amount === 999)).toBe(true);
  });
});
