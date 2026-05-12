/* 
    Extract one NormalizedTransaction per account-period pair from both
    source datasets. Where normalizeAccounts discovers the chart of accounts,
    this file extracts the financial amounts — how much each account moved in
    each reporting period.
*/

/*
    The two datasets encode this very differently:
    Dataset 1: periods are COLUMNS in a matrix. One row = one account,
              one column = one period. We must discover the period dates
              from column metadata before we can traverse the row tree.
    Dataset 2: periods are RECORDS in an array. One record = one period,
              with the full account tree nested inside it. We iterate
              every record to capture amounts across all periods.
*/

import { Dataset1Row, Dataset1Schema, isSectionRow } from '../../schemas/dataset1';
import { Dataset2LineItem, Dataset2Schema } from '../../schemas/dataset2';
import { DATASET2_CATEGORY_FIELDS, GROUP_TO_CATEGORY } from '../../types/constants';
import logger from '../../config/logger';
import { NormalizedTransaction } from '../../types/transaction';

// -- Dataset 1

/* 
    The report is a matrix: rows are the account tree, columns are reporting
    periods. Each leaf account row contains one cell per period column, and each
    cell holds the account's balance for that period.
    
    Step 1: Build a column index (colMeta) that maps column position → period dates.
            Only "Money" columns carry period dates — label columns and totals are skipped.
    Step 2: Traverse the row tree the same way as normalizeAccounts, but instead of
            registering the account itself, emit one transaction per period column.
*/
function normalizeDataSet1Transactions(rawData: unknown): NormalizedTransaction[] {
  logger.info('Normalizing Dataset 1 transactions');
  const { data } = Dataset1Schema.parse(rawData);
  const transactions: NormalizedTransaction[] = [];
  const currency = data.Header.Currency ?? 'USD';
  const cols = data.Columns?.Column ?? [];

  // ColMeta maps a column's index position to its period date range and label.
  interface ColMeta { periodStart: string; periodEnd: string; label: string }
  const colMeta: Record<number, ColMeta> = {};

  cols.forEach((col, i) => {
    // Only Money-type columns carry period dates — skip all of these.
    if (col.ColType !== 'Money') return;
    const meta = Object.fromEntries((col.MetaData ?? []).map(m => [m.Name, m.Value]));
    // Money columns without a StartDate are total/summary columns (e.g. "Total").
    if (!meta.StartDate) return;
    colMeta[i] = { periodStart: meta.StartDate, periodEnd: meta.EndDate, label: col.ColTitle ?? '' };
  });

  function iterate(row: Dataset1Row, group: string, depth = 0): void {
    if (depth > 20) throw new Error(`Dataset 1 transactions: max nesting depth exceeded at depth ${depth}`);

    if (isSectionRow(row)) {
      // Section rows carry the group name for their children.
      const currentGroup = row.group ?? group;
      for (const r of row.Rows?.Row ?? []) {
        iterate(r, currentGroup, depth + 1);
      }
    } else {
      // Leaf rows contain the actual balances. ColData[0] is the account label
      const colData = row.ColData ?? [];
      const accountId = colData[0]?.id;
      const accountName = colData[0]?.value;

      // Rows without an account id are summary/total rows — skip them.
      if (!accountId) return;

      // Emit one transaction per reporting period that has a valid numeric value.
      // The external_id combines account + period so it's unique per account-period pair.
      for (const [colIndexStr, meta] of Object.entries(colMeta)) {
        const cell = colData[parseInt(colIndexStr)];
        const rawValue = cell?.value;
        if (!rawValue) return;

        const amount = parseFloat(rawValue);
        if (isNaN(amount)) return;

        transactions.push({
          external_id: `dataset_1__${accountId}__${meta.periodStart}`,
          source: 'dataset_1',
          date: meta.periodStart,
          period_end: meta.periodEnd,
          amount,
          currency,
          description: accountName ?? `account_${accountId}`,
          // QuickBooks stores expenses as negative numbers. Negative = debit (money out),
          // positive = credit (money in).
          transaction_type: amount >= 0 ? 'credit' : 'debit',
          pl_group: group,
          pl_category: GROUP_TO_CATEGORY[group] ?? 'other',
          raw_data: {
            account_id: accountId,
            account_name: accountName,
            period: meta.label,
            value: rawValue,
          },
        });
      }
    }
  }

  for (const row of data.Rows.Row) {
    iterate(row, row.group ?? '');
  }

  logger.info('Dataset 1 transactions normalized', {
    count: transactions.length,
    periods: Object.keys(colMeta).length,
  });
  return transactions;
}

// -- Dataset 2

/* 
    Dataset 2 is structured as an array of period records, each containing the
    full account tree with amounts pre-populated for that period. Unlike the
    accounts normalizer (which only reads the first record for structure), here
    we must iterate ALL records because each period has different amounts.
*/
function iterateDataSet2LineItems(
  items: Dataset2LineItem[],
  categoryField: string,
  periodStart: string,
  periodEnd: string,
  transactions: NormalizedTransaction[],
  depth = 0
): void {
  if (depth > 20) throw new Error(`Dataset 2 transactions: max nesting depth exceeded at depth ${depth}`);

  for (const item of items) {
    if (!item.account_id) {
      // Grouping node with no account of its own
      // recurse into its children at the same depth so they're attached to the correct parent context.
      iterateDataSet2LineItems(item.line_items ?? [], categoryField, periodStart, periodEnd, transactions, depth);
      continue;
    }

    const amount = parseFloat(item.value ?? '0') || 0;

    // The external_id combines account + period start date to uniquely identify
    // this account's balance for this specific reporting period.
    transactions.push({
      external_id: `dataset_2__${item.account_id}__${periodStart}`,
      source: 'dataset_2',
      date: periodStart,
      period_end: periodEnd,
      amount,
      currency: 'USD',
      description: item.name ?? `account_${item.account_id}`,
      transaction_type: amount >= 0 ? 'credit' : 'debit',
      pl_group: categoryField,
      pl_category: GROUP_TO_CATEGORY[categoryField] ?? 'other',
      raw_data: {
        account_id: item.account_id,
        name: item.name,
        value: item.value,
        period_start: periodStart,
        period_end: periodEnd,
      },
    });

    // Recurse into children after emitting the parent — both levels produce
    // transactions so the P&L report can display subtotals and individual lines.
    if (item.line_items?.length) {
      iterateDataSet2LineItems(item.line_items, categoryField, periodStart, periodEnd, transactions, depth + 1);
    }
  }
}

function normalizeDataSet2Transactions(rawData: unknown): NormalizedTransaction[] {
  logger.info('Normalizing Dataset 2 transactions');
  const { data } = Dataset2Schema.parse(rawData);
  const transactions: NormalizedTransaction[] = [];

  // Iterate every period record — each one carries its own set of amounts.
  for (const record of data) {
    const { period_start, period_end } = record;
    for (const field of DATASET2_CATEGORY_FIELDS) {
      for (const cat of record[field] ?? []) {
        iterateDataSet2LineItems(cat.line_items ?? [], field, period_start, period_end, transactions);
      }
    }
  }

  logger.info('Dataset 2 transactions normalized', {
    count: transactions.length,
    periods: data.length,
  });
  return transactions;
}

// -- Public entry point
function normalizeTransactions(rawData: unknown, source: string): NormalizedTransaction[] {
  if (source === 'dataset_1') return normalizeDataSet1Transactions(rawData);
  if (source === 'dataset_2') return normalizeDataSet2Transactions(rawData);
  throw new Error(`Unknown source: ${source}`);
}

export default normalizeTransactions;
