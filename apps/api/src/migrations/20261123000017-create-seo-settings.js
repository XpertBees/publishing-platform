"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("seoSettings", {
      defaultDescription: { allowNull: false, type: Sequelize.TEXT },
      defaultOgImage: { type: Sequelize.STRING(500) },
      defaultTitle: { allowNull: false, type: Sequelize.STRING(160) },
      googleNewsEnabled: { allowNull: false, defaultValue: true, type: Sequelize.BOOLEAN },
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      robotsTxt: { type: Sequelize.TEXT },
      twitterHandle: { type: Sequelize.STRING(80) },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("seoSettings");
  },
};
