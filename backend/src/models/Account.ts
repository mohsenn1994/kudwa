import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

/* 
  "Account" is the standard accounting term for a ledger account (e.g., "Sales Revenue",
  "Cost of Goods Sold", "Rent Expense"). Every financial system (QuickBooks, Xero, etc.)
  organizes money into a chart of accounts. This model represents one entry in that chart.
*/
interface AccountAttributes {
  id: number; // Auto-incremented primary key
  external_id: string; // Unique ID from the source system (e.g., QuickBooks account ID)
  source: string; // Source system name (e.g., "QuickBooks")
  name: string; // Account name (e.g., "Sales Revenue")
  account_type: string; // Account type (e.g., "Revenue", "Expense", "Asset", "Liability")
  pl_group: string; // Profit & Loss group (e.g., "Revenue", "COGS", "Operating Expense") - used for P&L reports
  currency: string; // Currency code (e.g., "USD", "EUR")
  depth: number; // Depth in the account hierarchy (0 = top-level)
  parent_external_id: string | null; // External ID of the parent account, if any
  raw_data: Record<string, unknown>; // Full original payload from the source API
  created_at?: Date;
  updated_at?: Date;
}

interface AccountCreationAttributes
  extends Optional<AccountAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Account
  extends Model<AccountAttributes, AccountCreationAttributes>
  implements AccountAttributes
{
  declare id: number;
  declare external_id: string;
  declare source: string;
  declare name: string;
  declare account_type: string;
  declare pl_group: string;
  declare currency: string;
  declare depth: number;
  declare parent_external_id: string | null;
  declare raw_data: Record<string, unknown>;
  declare created_at: Date;
  declare updated_at: Date;
}

export function initAccount(sequelize: Sequelize): void {
  Account.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      external_id: { type: DataTypes.STRING, unique: true, allowNull: false },
      source: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      account_type: { type: DataTypes.STRING },
      pl_group: { type: DataTypes.STRING },
      currency: { type: DataTypes.STRING(10) },
      depth: { type: DataTypes.INTEGER, defaultValue: 0 },
      parent_external_id: { type: DataTypes.STRING, allowNull: true },
      // JSONB (not plain JSON) enables indexing and querying inside the payload in Postgres.
      raw_data: { type: DataTypes.JSONB },
    },
    {
      sequelize,
      tableName: 'accounts',
      underscored: true,
    }
  );
}
