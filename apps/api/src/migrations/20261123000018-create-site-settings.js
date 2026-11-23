"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("siteSettings", {
      adsenseClientId: { type: Sequelize.STRING(80) },
      faviconUrl: { type: Sequelize.STRING(500) },
      gaMeasurementId: { type: Sequelize.STRING(40) },
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      logoUrl: { type: Sequelize.STRING(500) },
      primaryColor: { allowNull: false, defaultValue: "#1d4ed8", type: Sequelize.STRING(20) },
      siteName: { allowNull: false, defaultValue: "The Daily Pulse", type: Sequelize.STRING(120) },
      socialLinks: { type: Sequelize.JSON },
      tagline: { type: Sequelize.STRING(200) },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("siteSettings");
  },
};
