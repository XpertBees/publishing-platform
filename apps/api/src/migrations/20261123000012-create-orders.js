"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("orders", {
      amount: { allowNull: false, type: Sequelize.INTEGER },
      buyerEmail: { allowNull: false, type: Sequelize.STRING(190) },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      currency: { allowNull: false, defaultValue: "INR", type: Sequelize.STRING(10) },
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      productId: {
        allowNull: false,
        onDelete: "RESTRICT",
        references: { key: "id", model: "products" },
        type: Sequelize.UUID,
      },
      productName: { allowNull: false, type: Sequelize.STRING(160) },
      provider: { type: Sequelize.STRING(80) },
      providerRef: { type: Sequelize.STRING(190) },
      status: {
        allowNull: false,
        defaultValue: "pending",
        type: Sequelize.ENUM("pending", "paid", "failed", "refunded"),
      },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
    await queryInterface.addIndex("orders", ["productId"]);
    await queryInterface.addIndex("orders", ["buyerEmail"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("orders");
  },
};
