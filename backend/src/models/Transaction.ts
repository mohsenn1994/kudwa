import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

/*
  "Transaction" is a single financial movement — a payment, a receipt, a journal entry.
  This is the unit of accounting data that gets extracted from integrations and
  displayed in P&L reports.
*/
interface TransactionAttributes {
  id: number; // Auto-incremented primary key
  account_id: number | null; // Foreign key to the Account this transaction belongs to. Nullable because we may not always be able to match it.
  external_id: string; // Unique ID from the source system (e.g., QuickBooks transaction ID)
  source: string; // Source system name (e.g., "QuickBooks")
  date: string; // Date the transaction occurred
  period_end: string; // End date of the period
  amount: number; // Monetary value of the transaction
  currency: string; // Currency code (e.g., "USD", "EUR")
  description: string; // Free-text memo from the source system
  transaction_type: string; // Debit vs. credit, or source-specific type such as "invoice" or "payment"
  pl_group: string; // Which P&L group this transaction rolls up into
  pl_category: string; // Finer-grained classification within the group
  raw_data: Record<string, unknown>; // Full original payload from the source API
  created_at?: Date;
  updated_at?: Date;
}

interface TransactionCreationAttributes
  extends Optional<TransactionAttributes, 'id' | 'account_id' | 'created_at' | 'updated_at'> {}

export class Transaction
  extends Model<TransactionAttributes, TransactionCreationAttributes>
  implements TransactionAttributes
{
  declare id: number;
  declare account_id: number | null;
  declare external_id: string;
  declare source: string;
  declare date: string;
  declare period_end: string;
  declare amount: number;
  declare currency: string;
  declare description: string;
  declare transaction_type: string;
  declare pl_group: string;
  declare pl_category: string;
  declare raw_data: Record<string, unknown>;
  declare created_at: Date;
  declare updated_at: Date;
}

export function initTransaction(sequelize: Sequelize): void {
  Transaction.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      account_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'accounts', key: 'id' },
      },
      external_id: { type: DataTypes.STRING, unique: true, allowNull: false },
      source: { type: DataTypes.STRING, allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      period_end: { type: DataTypes.DATEONLY },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      currency: { type: DataTypes.STRING(10) },
      description: { type: DataTypes.STRING },
      transaction_type: { type: DataTypes.STRING(10) },
      pl_group: { type: DataTypes.STRING },
      pl_category: { type: DataTypes.STRING },
      // JSONB (not plain JSON) enables indexing and querying inside the payload in Postgres.
      raw_data: { type: DataTypes.JSONB },
    },
    {
      sequelize,
      tableName: 'transactions',
      underscored: true,
    }
  );
}
