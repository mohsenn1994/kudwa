import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

/*
  A line item is one row in a rendered P&L report, e.g., "Payroll: $120,000".
  This model stores the detail level that sits beneath the ProfitLossReport header.
  Together, the header + line items make up a complete, displayable P&L statement.
*/
interface ProfitLossLineItemAttributes {
  id: number; // Auto-incremented primary key
  report_id: number; // Foreign key to the ProfitLossReport this line item belongs to
  parent_id: number | null; // For hierarchical line items, this points to the parent line. Null for top-level lines.
  name: string; // The display name of this line item, e.g., "Payroll" or "Office Supplies"
  category: string; // The category this line item falls under, e.g., "Operating Expense" or "Revenue"
  pl_group: string; // Which P&L group this line rolls up into, e.g., "Revenue", "COGS", "Operating Expense"
  amount: number; // The monetary value of this line item
  depth: number; // The hierarchical depth of this line item
  sort_order: number; // Controls display order of rows within the report
  period_start: string; // The start date of the period this line item covers
  period_end: string; // The end date of the period this line item covers
  created_at?: Date;
  updated_at?: Date;
}

interface ProfitLossLineItemCreationAttributes
  extends Optional<ProfitLossLineItemAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class ProfitLossLineItem
  extends Model<ProfitLossLineItemAttributes, ProfitLossLineItemCreationAttributes>
  implements ProfitLossLineItemAttributes
{
  declare id: number;
  declare report_id: number;
  declare parent_id: number | null;
  declare name: string;
  declare category: string;
  declare pl_group: string;
  declare amount: number;
  declare depth: number;
  declare sort_order: number;
  declare period_start: string;
  declare period_end: string;
  declare created_at: Date;
  declare updated_at: Date;
}

export function initProfitLossLineItem(sequelize: Sequelize): void {
  ProfitLossLineItem.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      report_id: { type: DataTypes.INTEGER, allowNull: false },
      parent_id: { type: DataTypes.INTEGER, allowNull: true },
      name: { type: DataTypes.STRING, allowNull: false },
      category: { type: DataTypes.STRING },
      pl_group: { type: DataTypes.STRING },
      amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
      depth: { type: DataTypes.INTEGER, defaultValue: 0 },
      sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
      period_start: { type: DataTypes.DATEONLY },
      period_end: { type: DataTypes.DATEONLY },
    },
    {
      sequelize,
      tableName: 'profit_loss_line_items',
      underscored: true,
    }
  );
}
