"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("media", {
      alt: { type: Sequelize.STRING(255) },
      createdAt: {
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        type: Sequelize.DATE,
      },
      filename: { allowNull: false, type: Sequelize.STRING(255) },
      height: { type: Sequelize.INTEGER },
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      mimeType: { allowNull: false, type: Sequelize.STRING(100) },
      size: { allowNull: false, type: Sequelize.INTEGER },
      uploadedBy: {
        onDelete: "SET NULL",
        references: { key: "id", model: "users" },
        type: Sequelize.UUID,
      },
      url: { allowNull: false, type: Sequelize.STRING(500) },
      width: { type: Sequelize.INTEGER },
    });
    await queryInterface.addIndex("media", ["uploadedBy"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("media");
  },
};
