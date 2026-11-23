"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tags", {
      createdAt: {
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        type: Sequelize.DATE,
      },
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      name: { allowNull: false, type: Sequelize.STRING(60) },
      slug: { allowNull: false, type: Sequelize.STRING(60), unique: true },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("tags");
  },
};
