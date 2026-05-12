import { Transaction } from 'sequelize';
import { Account } from '../../models/Account';
import { NormalizedAccount } from '../../types/account';
import logger from '../../config/logger';

async function loadAccounts(accounts: NormalizedAccount[], dbTransaction: Transaction): Promise<void> {
  await Account.bulkCreate(
    accounts.map(a => ({
      external_id: a.external_id,
      source: a.source,
      name: a.name,
      account_type: a.account_type,
      pl_group: a.pl_group,
      currency: a.currency,
      depth: a.depth,
      parent_external_id: a.parent_external_id,
      raw_data: a.raw_data,
    })),
    {
      updateOnDuplicate: ['name', 'account_type', 'pl_group', 'currency', 'depth', 'parent_external_id', 'raw_data'],
      transaction: dbTransaction,
    }
  );
  logger.info(`Accounts created: ${accounts.length}`);
}

export default loadAccounts;
