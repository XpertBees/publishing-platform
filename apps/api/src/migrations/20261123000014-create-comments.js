"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("comments", {
      authorEmail: { type: Sequelize.STRING(190) },
      authorName: { allowNull: false, type: Sequelize.STRING(120) },
      body: { allowNull: false, type: Sequelize.TEXT },
      createdAt: {
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        type: Sequelize.DATE,
      },
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      postId: {
        allowNull: false,
        onDelete: "CASCADE",
        references: { key: "id", model: "posts" },
        type: Sequelize.UUID,
      },
      status: {
        allowNull: false,
        defaultValue: "pending",
        type: Sequelize.ENUM("pending", "approved", "spam", "rejected"),
      },
    });
    await queryInterface.addIndex("comments", ["postId", "status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("comments");
  },
};
