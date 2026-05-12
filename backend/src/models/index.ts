import { Sequelize } from 'sequelize';
import config from '../config/database';
import { Account, initAccount } from './Account';
import { initTransaction, Transaction } from './Transaction';
import { initProfitLossReport, ProfitLossReport } from './ProfitLossReport';
import { initProfitLossLineItem, ProfitLossLineItem } from './ProfitLossLineItem';

export const sequelize = new Sequelize(
  config.database as string,
  config.username as string,
  config.password ?? undefined,
  {
    host: config.host,
    port: config.port,
    dialect: 'postgres',
    logging: config.logging,
  }
);

initAccount(sequelize);
initTransaction(sequelize);
initProfitLossReport(sequelize);
initProfitLossLineItem(sequelize);

// Account ↔ Transaction
Account.hasMany(Transaction, { foreignKey: 'account_id', as: 'transactions' });
Transaction.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

// ProfitLossReport ↔ ProfitLossLineItem
ProfitLossReport.hasMany(ProfitLossLineItem, { foreignKey: 'report_id', as: 'lineItems' });
ProfitLossLineItem.belongsTo(ProfitLossReport, { foreignKey: 'report_id' });

// ProfitLossLineItem self-referential (parent ↔ children)
ProfitLossLineItem.hasMany(ProfitLossLineItem, { foreignKey: 'parent_id', as: 'children' });
ProfitLossLineItem.belongsTo(ProfitLossLineItem, { foreignKey: 'parent_id', as: 'parent' });

export { Account, Transaction, ProfitLossReport, ProfitLossLineItem };