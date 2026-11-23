"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("postTags", {
      postId: {
        onDelete: "CASCADE",
        primaryKey: true,
        references: { key: "id", model: "posts" },
        type: Sequelize.UUID,
      },
      tagId: {
        onDelete: "CASCADE",
        primaryKey: true,
        references: { key: "id", model: "tags" },
        type: Sequelize.UUID,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("postTags");
  },
};
