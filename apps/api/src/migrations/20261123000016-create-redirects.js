"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("redirects", {
      active: { allowNull: false, defaultValue: true, type: Sequelize.BOOLEAN },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      from: { allowNull: false, type: Sequelize.STRING(500), unique: true },
      hits: { allowNull: false, defaultValue: 0, type: Sequelize.INTEGER },
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      statusCode: { allowNull: false, defaultValue: 301, type: Sequelize.INTEGER },
      to: { allowNull: false, type: Sequelize.STRING(500) },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("redirects");
  },
};
