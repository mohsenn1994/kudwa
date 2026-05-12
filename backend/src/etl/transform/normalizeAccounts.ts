/*
    Convert raw data from both source datasets into a flat array of
    NormalizedAccount objects that share a consistent shape. This step is purely
    structural — it discovers what accounts exist and where they sit in the chart
    of accounts. It does not touch financial amounts (that is normalizeTransactions).
*/

/* 
    Both datasets represent accounts as trees (sections containing sub-sections
    containing leaf accounts). The output is a flat list where each account carries
    enough metadata (depth, parent_external_id) to reconstruct the hierarchy later
    if needed — for example, when building nested line items for the P&L report.
*/

import { Dataset1Row, Dataset1Schema, isSectionRow } from '../../schemas/dataset1';
import { Dataset2LineItem, Dataset2Schema } from '../../schemas/dataset2';
import { DATASET2_CATEGORY_FIELDS, GROUP_TO_CATEGORY } from '../../types/constants';
import logger from '../../config/logger';
import { NormalizedAccount } from '../../types/account';

// -- Dataset 1

/* 
    Dataset 1 is a QuickBooks P&L report. Its structure is a nested row tree:

   Section (Income)
     Section (Product Sales)        ← sub-section, not a real account
       Data row (id: 12345)         ← leaf account, this is what we want
       Data row (id: 12346)
       Data row (id: 12347)
   Section (Expenses)
     ...
*/

// We traverse depth-first, carrying three pieces of context down the tree:
//   - group: the P&L category inherited from the nearest Section ancestor
//   - parentExternalId: the stable id of the nearest parent Section, so leaf
//     accounts know which section they belong to
//   - depth: nesting level, used for display ordering and as a recursion guard
function normalizeDataSet1Accounts(rawData: unknown): NormalizedAccount[] {
  logger.info('Normalizing Dataset 1 accounts');
  const { data } = Dataset1Schema.parse(rawData);
  const accounts: NormalizedAccount[] = [];
  const currency = data.Header.Currency ?? 'USD';

  function iterate(row: Dataset1Row, group: string, parentExternalId: string | null, depth: number): void {
    // Safety guard against malformed or circular data.
    // QuickBooks reports are typically 3–6 levels deep, so anything beyond 20 is almost certainly wrong.
    if (depth > 20) throw new Error(`Dataset 1 accounts: max nesting depth exceeded at depth ${depth}`);

    if (isSectionRow(row)) {
      // Sections are grouping containers
      // they define which P&L category their children belong to
      const currentGroup = row.group ?? group;
      const sectionName = row.Header?.ColData?.[0]?.value ?? currentGroup;

      // Build a readable id for this section node
      // (e.g. dataset_1__section__Income__ProductSales vs dataset_1__section__Income).
      const sectionExternalId = parentExternalId
        ? `dataset_1__section__${currentGroup}__${sectionName}`
        : `dataset_1__section__${currentGroup}`;

      for (const r of row.Rows?.Row ?? []) {
        iterate(r, currentGroup, sectionExternalId, depth + 1);
      }
    } else {
      // Leaf rows are individual accounts. The account id and display name live in ColData[0]
      const id = row.ColData?.[0]?.id;
      const name = row.ColData?.[0]?.value;

      // Rows without an id are summary/total lines (e.g. "Total Income").
      if (!id) return;

      accounts.push({
        external_id: `dataset_1__${id}`,
        source: 'dataset_1',
        name: name ?? `account_${id}`,
        account_type: GROUP_TO_CATEGORY[group] ?? 'other',
        pl_group: group,
        currency,
        depth,
        parent_external_id: parentExternalId,
        raw_data: { id, name, group },
      });
    }
  }

  // Each top-level row in the report is a P&L section (Income, COGS, Expenses,
  // etc.) carrying its own group name. There is no parent above the top level.
  for (const row of data.Rows.Row) {
    iterate(row, row.group ?? '', null, 0);
  }

  logger.info('Dataset 1 accounts normalized', { count: accounts.length });
  return accounts;
}

// -- Dataset 2

/* 
    Dataset 2 is a time-series of period records. Each record has the same five
    top-level category fields (revenue, cost_of_goods_sold, etc.), each holding
    an array of category objects whose line_items contain the account tree.
*/
function normalizeDataSet2Accounts(rawData: unknown): NormalizedAccount[] {
  logger.info('Normalizing Dataset 2 accounts');
  const { data } = Dataset2Schema.parse(rawData);

  // Map keyed by external_id so each account is registered only once
  const accountMap = new Map<string, NormalizedAccount>();

  function iterateLineItems(
    items: Dataset2LineItem[],
    categoryField: string,
    parentExternalId: string | null,
    depth: number
  ): void {
    if (depth > 20) throw new Error(`Dataset 2 accounts: max nesting depth exceeded at depth ${depth}`);

    for (const item of items) {
      if (!item.account_id) {
        // Items without an account_id are intermediate grouping nodes
        iterateLineItems(item.line_items ?? [], categoryField, parentExternalId, depth);
        continue;
      }

      const externalId = `dataset_2__${item.account_id}`;

      // Only register the first time we see this account. 
      // Later period records contain the same accounts with different amounts
      if (!accountMap.has(externalId)) {
        accountMap.set(externalId, {
          external_id: externalId,
          source: 'dataset_2',
          name: item.name ?? `account_${item.account_id}`,
          account_type: GROUP_TO_CATEGORY[categoryField] ?? 'other',
          pl_group: categoryField,
          currency: 'USD',
          depth,
          parent_external_id: parentExternalId,
          raw_data: { account_id: item.account_id, name: item.name, category: categoryField },
        });
      }

      // Recurse into children, passing this account as their parent
      if (item.line_items?.length) {
        iterateLineItems(item.line_items, categoryField, externalId, depth + 1);
      }
    }
  }

  // Only process the first period record
  const firstRecord = data[0];
  if (!firstRecord) {
    logger.warn('Dataset 2 accounts: no period records found, returning empty list');
    return [];
  }

  // Each of the five category fields (revenue, cost_of_goods_sold, etc.) contains an array of top-level accounts for that category. 
  // We need to iterate them all to discover the full chart of accounts
  for (const field of DATASET2_CATEGORY_FIELDS) {
    for (const cat of firstRecord[field] ?? []) {
      iterateLineItems(cat.line_items ?? [], field, null, 0);
    }
  }

  // Convert the map values to an array for output
  const accounts = Array.from(accountMap.values());
  logger.info('Dataset 2 accounts normalized', { count: accounts.length });
  return accounts;
}

// -- Public entry point
function normalizeAccounts(rawData: unknown, source: string): NormalizedAccount[] {
  if (source === 'dataset_1') return normalizeDataSet1Accounts(rawData);
  if (source === 'dataset_2') return normalizeDataSet2Accounts(rawData);
  throw new Error(`Unknown source: ${source}`);
}

export default normalizeAccounts;
