"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("products", {
      active: { allowNull: false, defaultValue: true, type: Sequelize.BOOLEAN },
      coverImage: { type: Sequelize.STRING(500) },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      currency: { allowNull: false, defaultValue: "INR", type: Sequelize.STRING(10) },
      description: { type: Sequelize.TEXT },
      fileUrl: { type: Sequelize.STRING(500) },
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      name: { allowNull: false, type: Sequelize.STRING(160) },
      price: { allowNull: false, type: Sequelize.INTEGER },
      sales: { allowNull: false, defaultValue: 0, type: Sequelize.INTEGER },
      slug: { allowNull: false, type: Sequelize.STRING(120), unique: true },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("products");
  },
};
