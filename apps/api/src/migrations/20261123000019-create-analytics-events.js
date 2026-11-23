"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("analyticsEvents", {
      createdAt: {
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        type: Sequelize.DATE,
      },
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      path: { type: Sequelize.STRING(500) },
      postId: {
        onDelete: "SET NULL",
        references: { key: "id", model: "posts" },
        type: Sequelize.UUID,
      },
      referrer: { type: Sequelize.STRING(500) },
      type: { allowNull: false, type: Sequelize.STRING(60) },
    });
    await queryInterface.addIndex("analyticsEvents", ["type", "createdAt"]);
    await queryInterface.addIndex("analyticsEvents", ["postId"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("analyticsEvents");
  },
};
