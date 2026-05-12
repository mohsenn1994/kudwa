import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

/*  
  A Profit & Loss (P&L) report summarizes revenue,
  costs, and profit over a time period. This model is the header record for one such report.
  The individual rows inside the report are stored separately in ProfitLossLineItem.
*/
interface ProfitLossReportAttributes {
  id: number; // Auto-incremented primary key
  period_start: Date; // Start date of the reporting period
  period_end: Date; // End date of the reporting period
  total_revenue: number; // Sum of all revenue transactions in the period
  total_cogs: number; // Sum of all cost of goods sold transactions in the period
  gross_profit: number; // total_revenue - total_cogs
  total_expenses: number; // Sum of all operating expense transactions in the period
  net_operating_income: number; // gross_profit - total_expenses
  total_other_income: number; // Sum of all non-operating income transactions (e.g., interest income)
  total_other_expenses: number; // Sum of all non-operating expense transactions (e.g., interest expense)
  net_profit: number; // net_operating_income + total_other_income - total_other_expenses
  currency: string; // The reporting currency for all aggregated figures on this report
  period_label: string; // Human-friendly label for display in the UI, e.g., "Q1 2025" or "FY 2024"
  sources_integrated: string[]; // Lists which integrations contributed data to this report, e.g., ["quickbooks", "stripe"]
  status: 'processing' | 'complete' | 'failed'; // Report lifecycle status
  created_at?: Date;
  updated_at?: Date;
}

interface ProfitLossReportCreationAttributes
  extends Optional<ProfitLossReportAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class ProfitLossReport
  extends Model<ProfitLossReportAttributes, ProfitLossReportCreationAttributes>
  implements ProfitLossReportAttributes
{
  declare id: number;
  declare period_start: Date;
  declare period_end: Date;
  declare total_revenue: number;
  declare total_cogs: number;
  declare gross_profit: number;
  declare total_expenses: number;
  declare net_operating_income: number;
  declare total_other_income: number;
  declare total_other_expenses: number;
  declare net_profit: number;
  declare currency: string;
  declare period_label: string;
  declare sources_integrated: string[];
  declare status: 'processing' | 'complete' | 'failed';
  declare created_at: Date;
  declare updated_at: Date;
}

export function initProfitLossReport(sequelize: Sequelize): void {
  ProfitLossReport.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      period_start: { type: DataTypes.DATEONLY, allowNull: false },
      period_end: { type: DataTypes.DATEONLY, allowNull: false },
      total_revenue: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
      total_cogs: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
      gross_profit: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
      total_expenses: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
      net_operating_income: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
      total_other_income: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
      total_other_expenses: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
      net_profit: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
      currency: { type: DataTypes.STRING(10), defaultValue: 'USD' },
      period_label: { type: DataTypes.STRING },
      sources_integrated: { type: DataTypes.ARRAY(DataTypes.STRING) },
      status: {
        type: DataTypes.ENUM('processing', 'complete', 'failed'),
        defaultValue: 'processing',
      },
    },
    {
      sequelize,
      tableName: 'profit_loss_reports',
      underscored: true,
    }
  );
}
