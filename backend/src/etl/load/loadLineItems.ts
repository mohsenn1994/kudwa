import { Transaction } from 'sequelize';
import { ProfitLossLineItem as ProfitLossLineItemModel } from '../../models/ProfitLossLineItem';
import { ProfitLossLineItem } from '../../types/profitAndLoss';
import logger from '../../config/logger';

// Saves P&L line items for a report. Parents (depth 0) are inserted first so
// their DB ids are available when inserting children (depth 1) with parent_id.
async function loadLineItems(
  lineItems: ProfitLossLineItem[],
  reportId: number,
  dbTransaction: Transaction
): Promise<void> {
  const parentLineItems = await ProfitLossLineItemModel.bulkCreate(
    lineItems
      .filter(li => li.depth === 0)
      .map(li => ({
        report_id: reportId,
        parent_id: null,
        name: li.name,
        category: li.category,
        pl_group: li.pl_group,
        amount: li.amount,
        depth: li.depth,
        sort_order: li.sort_order,
        period_start: li.period_start,
        period_end: li.period_end,
      })),
    { transaction: dbTransaction }
  );

  const parentIdByName = new Map(parentLineItems.map(p => [p.name, p.id]));

  const childRows = lineItems.flatMap(li =>
    (li.children ?? []).map(child => ({
      report_id: reportId,
      parent_id: parentIdByName.get(li.name) ?? null,
      name: child.name,
      category: child.category,
      pl_group: child.pl_group,
      amount: child.amount,
      depth: child.depth,
      sort_order: child.sort_order,
      period_start: child.period_start,
      period_end: child.period_end,
    }))
  );

  if (childRows.length) {
    await ProfitLossLineItemModel.bulkCreate(childRows, { transaction: dbTransaction });
  }

  logger.info(`Line items saved: ${parentLineItems.length} sections, ${childRows.length} accounts`);
}

export default loadLineItems;
