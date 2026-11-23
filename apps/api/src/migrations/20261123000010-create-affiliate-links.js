"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("affiliateLinks", {
      active: { allowNull: false, defaultValue: true, type: Sequelize.BOOLEAN },
      category: { type: Sequelize.STRING(80) },
      clicks: { allowNull: false, defaultValue: 0, type: Sequelize.INTEGER },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      slug: { allowNull: false, type: Sequelize.STRING(80), unique: true },
      targetUrl: { allowNull: false, type: Sequelize.STRING(1000) },
      title: { allowNull: false, type: Sequelize.STRING(160) },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("affiliateLinks");
  },
};
