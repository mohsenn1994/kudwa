'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('profit_loss_line_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      report_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'profit_loss_reports', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'profit_loss_line_items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING,
      },
      pl_group: {
        type: Sequelize.STRING,
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      depth: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      period_start: {
        type: Sequelize.DATEONLY,
      },
      period_end: {
        type: Sequelize.DATEONLY,
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
    await queryInterface.dropTable('profit_loss_line_items');
  },
};
