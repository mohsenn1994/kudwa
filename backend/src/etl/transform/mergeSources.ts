/* 
    Combine the normalized accounts and transactions from both datasets
    into a single deduplicated result ready for the P&L build step.
*/

import { MergedSources } from '../../types/profitAndLoss';
import { NormalizedTransaction } from '../../types/transaction';
import { NormalizedAccount } from '../../types/account';
import logger from '../../config/logger';

interface SourceData {
  accounts: NormalizedAccount[];
  transactions: NormalizedTransaction[];
}

function mergeSources(source1: SourceData, source2: SourceData): MergedSources {
  const accountMap = new Map<string, NormalizedAccount>();
  const transactionMap = new Map<string, NormalizedTransaction>();

  // Concat data_set_1 then data_set_2 before inserting, so if both sources ever produce the
  // same external_id the data_set_2 entry wins (it overwrites data_set_1 in the Map).
  [...source1.accounts, ...source2.accounts].forEach(a => {
    accountMap.set(a.external_id, a);
  });

  [...source1.transactions, ...source2.transactions].forEach(t => {
    transactionMap.set(t.external_id, t);
  });

  const accounts = Array.from(accountMap.values());
  const transactions = Array.from(transactionMap.values());

  logger.info('Sources merged', {
    accounts: accounts.length,
    transactions: transactions.length,
  });

  return { accounts, transactions };
}

export default mergeSources;
