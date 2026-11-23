"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("rssItems", {
      category: { allowNull: false, type: Sequelize.STRING(80) },
      createdAt: {
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        type: Sequelize.DATE,
      },
      guid: { allowNull: false, type: Sequelize.STRING(500), unique: true },
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      imported: { allowNull: false, defaultValue: false, type: Sequelize.BOOLEAN },
      link: { allowNull: false, type: Sequelize.STRING(500) },
      postId: {
        onDelete: "SET NULL",
        references: { key: "id", model: "posts" },
        type: Sequelize.UUID,
      },
      publishedAt: { type: Sequelize.DATE },
      sourceId: {
        allowNull: false,
        onDelete: "CASCADE",
        references: { key: "id", model: "rssSources" },
        type: Sequelize.UUID,
      },
      sourceName: { allowNull: false, type: Sequelize.STRING(120) },
      summary: { type: Sequelize.TEXT },
      title: { allowNull: false, type: Sequelize.STRING(500) },
    });
    await queryInterface.addIndex("rssItems", ["sourceId"]);
    await queryInterface.addIndex("rssItems", ["publishedAt"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("rssItems");
  },
};
