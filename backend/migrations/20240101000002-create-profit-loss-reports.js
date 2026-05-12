'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('profit_loss_reports', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      period_start: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      period_end: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      total_revenue: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_cogs: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      gross_profit: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_expenses: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      net_operating_income: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_other_income: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_other_expenses: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      net_profit: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      currency: {
        type: Sequelize.STRING(10),
        defaultValue: 'USD',
      },
      period_label: {
        type: Sequelize.STRING,
      },
      sources_integrated: {
        type: Sequelize.ARRAY(Sequelize.STRING),
      },
      status: {
        type: Sequelize.ENUM('processing', 'complete', 'failed'),
        defaultValue: 'processing',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('profit_loss_reports');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_profit_loss_reports_status";');
  },
};
