"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("rssSources", {
      active: { allowNull: false, defaultValue: true, type: Sequelize.BOOLEAN },
      category: { allowNull: false, type: Sequelize.STRING(80) },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      fetchIntervalMinutes: { allowNull: false, defaultValue: 15, type: Sequelize.INTEGER },
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      lastFetchedAt: { type: Sequelize.DATE },
      lastItemCount: { allowNull: false, defaultValue: 0, type: Sequelize.INTEGER },
      name: { allowNull: false, type: Sequelize.STRING(120) },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
      url: { allowNull: false, type: Sequelize.STRING(500) },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("rssSources");
  },
};
