'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('accounts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      external_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      source: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      account_type: {
        type: Sequelize.STRING,
      },
      pl_group: {
        type: Sequelize.STRING,
      },
      currency: {
        type: Sequelize.STRING(10),
      },
      depth: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      parent_external_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      raw_data: {
        type: Sequelize.JSONB,
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
    await queryInterface.dropTable('accounts');
  },
};
