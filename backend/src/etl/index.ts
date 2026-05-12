import logger from '../config/logger';
import { sequelize } from '../models';
import { ProfitLossReport } from '../models/ProfitLossReport';
import { PipelineResponse } from '../types/pipeline';
import extractDataset1 from './extract/extractDataset1';
import extractDataset2 from './extract/extractDataset2';
import loadAccounts from './load/loadAccounts';
import loadLineItems from './load/loadLineItems';
import loadTransactions from './load/loadTransactions';
import buildProfitAndLoss from './transform/buildProfitAndLoss';
import mergeSources from './transform/mergeSources';
import normalizeAccounts from './transform/normalizeAccounts';
import normalizeTransactions from './transform/normalizeTransactions';

export async function runPipeline(): Promise<PipelineResponse> {
  logger.info('ETL pipeline starting...');
  const startedAt = Date.now();

  // Reject immediately if another run is already in progress — before doing any work.
  const alreadyRunning = await ProfitLossReport.findOne({ where: { status: 'processing' } });
  if (alreadyRunning) {
    throw Object.assign(new Error('A pipeline run is already in progress'), { status: 409 });
  }

  // -- Extract --
  logger.info('Extracting data from sources...');
  const [set1, set2] = await Promise.all([extractDataset1(), extractDataset2()]);
  logger.info('Data extraction completed');

  // -- Transform --
  logger.info('Transforming data...');

  const normalizedAccounts1 = normalizeAccounts(set1, 'dataset_1');
  const normalizedAccounts2 = normalizeAccounts(set2, 'dataset_2');
  logger.info('Accounts normalized', {
    dataset1Accounts: normalizedAccounts1.length,
    dataset2Accounts: normalizedAccounts2.length,
  });

  const normalizedTransactions1 = normalizeTransactions(set1, 'dataset_1');
  const normalizedTransactions2 = normalizeTransactions(set2, 'dataset_2');
  logger.info('Transactions normalized', {
    dataset1Transactions: normalizedTransactions1.length,
    dataset2Transactions: normalizedTransactions2.length,
  });

  const mergedData = mergeSources(
    { accounts: normalizedAccounts1, transactions: normalizedTransactions1 },
    { accounts: normalizedAccounts2, transactions: normalizedTransactions2 }
  );
  logger.info('Data merged', {
    totalAccounts: mergedData.accounts.length,
    totalTransactions: mergedData.transactions.length,
  });

  const profitLossReport = buildProfitAndLoss(mergedData.transactions);
  logger.info('P&L report built', {
    netProfit: profitLossReport.netProfit,
    grossProfit: profitLossReport.grossProfit,
    period: profitLossReport.periodLabel,
  });

  // Create the report record with 'processing' status now that we have the
  // computed values. Any concurrent run that starts here will see this record
  // and be rejected by the check above.
  const savedReport = await ProfitLossReport.create({
    period_start: new Date(profitLossReport.periodStart),
    period_end: new Date(profitLossReport.periodEnd),
    period_label: profitLossReport.periodLabel,
    currency: profitLossReport.currency,
    total_revenue: profitLossReport.totalRevenue,
    total_cogs: profitLossReport.totalCogs,
    gross_profit: profitLossReport.grossProfit,
    total_expenses: profitLossReport.totalExpenses,
    net_operating_income: profitLossReport.netOperatingIncome,
    total_other_income: profitLossReport.totalOtherIncome,
    total_other_expenses: profitLossReport.totalOtherExpenses,
    net_profit: profitLossReport.netProfit,
    sources_integrated: ['dataset_1', 'dataset_2'],
    status: 'processing',
  });

  // -- Load --
  // All DB writes run inside a single transaction so a partial failure leaves
  // no orphaned rows. On any error we roll back, mark the report 'failed', and
  // re-throw so the caller receives the original error.
  logger.info('Loading data into database...');
  const dbTransaction = await sequelize.transaction();

  try {
    await loadAccounts(mergedData.accounts, dbTransaction);
    await loadTransactions(mergedData.transactions, dbTransaction);
    await loadLineItems(profitLossReport.lineItems, savedReport.id, dbTransaction);

    await savedReport.update({ status: 'complete' }, { transaction: dbTransaction });
    await dbTransaction.commit();
    logger.info('Load complete — transaction committed');
  } catch (err) {
    await dbTransaction.rollback();
    await savedReport.update({ status: 'failed' });
    logger.error('Load failed — transaction rolled back', { error: err });
    throw err;
  }

  const duration = ((Date.now() - startedAt) / 1000).toFixed(2);
  logger.info(`ETL pipeline completed in ${duration}s`);

  return {
    duration: `${duration}s`,
    accountsLoaded: mergedData.accounts.length,
    transactionsLoaded: mergedData.transactions.length,
    reportId: savedReport.id,
    periodLabel: profitLossReport.periodLabel,
    netProfit: profitLossReport.netProfit,
  };
}
