"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("newsletterSubscribers", {
      createdAt: {
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        type: Sequelize.DATE,
      },
      email: { allowNull: false, type: Sequelize.STRING(190), unique: true },
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      source: { type: Sequelize.STRING(80) },
      status: {
        allowNull: false,
        defaultValue: "subscribed",
        type: Sequelize.ENUM("subscribed", "unsubscribed"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("newsletterSubscribers");
  },
};
