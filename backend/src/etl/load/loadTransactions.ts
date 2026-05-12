import { Transaction } from 'sequelize';
import { Transaction as TransactionModel } from '../../models/Transaction';
import { NormalizedTransaction } from '../../types/transaction';
import logger from '../../config/logger';

async function loadTransactions(transactions: NormalizedTransaction[], dbTransaction: Transaction): Promise<void> {
  await TransactionModel.bulkCreate(
    transactions.map(t => ({
      external_id: t.external_id,
      source: t.source,
      date: t.date,
      period_end: t.period_end,
      amount: t.amount,
      currency: t.currency,
      description: t.description,
      transaction_type: t.transaction_type,
      pl_group: t.pl_group,
      pl_category: t.pl_category,
      raw_data: t.raw_data,
    })),
    {
      updateOnDuplicate: ['amount', 'description', 'transaction_type', 'pl_group', 'pl_category', 'raw_data'],
      transaction: dbTransaction,
    }
  );
  logger.info(`Transactions created: ${transactions.length}`);
}

export default loadTransactions;
