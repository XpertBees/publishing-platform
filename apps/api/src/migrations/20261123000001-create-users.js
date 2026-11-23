"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      createdAt: { allowNull: false, type: Sequelize.DATE },
      email: { allowNull: false, type: Sequelize.STRING(190), unique: true },
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      isActive: { allowNull: false, defaultValue: true, type: Sequelize.BOOLEAN },
      name: { allowNull: false, type: Sequelize.STRING(120) },
      passwordHash: { allowNull: false, type: Sequelize.STRING(255) },
      role: {
        allowNull: false,
        defaultValue: "author",
        type: Sequelize.ENUM(
          "super_admin",
          "admin",
          "editor",
          "author",
          "news_editor",
          "seo_manager",
          "marketing_manager",
          "analyst",
        ),
      },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("users");
  },
};
