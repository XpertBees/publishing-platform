"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("banners", {
      active: { allowNull: false, defaultValue: true, type: Sequelize.BOOLEAN },
      clicks: { allowNull: false, defaultValue: 0, type: Sequelize.INTEGER },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      endsAt: { type: Sequelize.DATE },
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      imageUrl: { allowNull: false, type: Sequelize.STRING(500) },
      impressions: { allowNull: false, defaultValue: 0, type: Sequelize.INTEGER },
      linkUrl: { type: Sequelize.STRING(500) },
      placement: { allowNull: false, type: Sequelize.STRING(80) },
      startsAt: { type: Sequelize.DATE },
      title: { allowNull: false, type: Sequelize.STRING(120) },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
    await queryInterface.addIndex("banners", ["placement", "active"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("banners");
  },
};
