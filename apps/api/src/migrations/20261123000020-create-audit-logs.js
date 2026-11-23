"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("auditLogs", {
      action: { allowNull: false, type: Sequelize.STRING(120) },
      createdAt: {
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        type: Sequelize.DATE,
      },
      entity: { allowNull: false, type: Sequelize.STRING(80) },
      entityId: { type: Sequelize.STRING(100) },
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      meta: { type: Sequelize.JSON },
      userId: {
        onDelete: "SET NULL",
        references: { key: "id", model: "users" },
        type: Sequelize.UUID,
      },
    });
    await queryInterface.addIndex("auditLogs", ["entity", "createdAt"]);
    await queryInterface.addIndex("auditLogs", ["userId"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("auditLogs");
  },
};
