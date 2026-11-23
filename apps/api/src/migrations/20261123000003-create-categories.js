"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("categories", {
      createdAt: { allowNull: false, type: Sequelize.DATE },
      description: { type: Sequelize.TEXT },
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      isVertical: { allowNull: false, defaultValue: false, type: Sequelize.BOOLEAN },
      name: { allowNull: false, type: Sequelize.STRING(80) },
      order: { allowNull: false, defaultValue: 0, type: Sequelize.INTEGER },
      parentId: {
        onDelete: "SET NULL",
        references: { key: "id", model: "categories" },
        type: Sequelize.UUID,
      },
      seo: { type: Sequelize.JSON },
      slug: { allowNull: false, type: Sequelize.STRING(80), unique: true },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
    await queryInterface.addIndex("categories", ["parentId"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("categories");
  },
};
