"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("authors", {
      avatar: { type: Sequelize.STRING(500) },
      bio: { type: Sequelize.TEXT },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      name: { allowNull: false, type: Sequelize.STRING(120) },
      role: { type: Sequelize.STRING(80) },
      slug: { allowNull: false, type: Sequelize.STRING(120), unique: true },
      socials: { type: Sequelize.JSON },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
      userId: {
        onDelete: "SET NULL",
        references: { key: "id", model: "users" },
        type: Sequelize.UUID,
        unique: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("authors");
  },
};
