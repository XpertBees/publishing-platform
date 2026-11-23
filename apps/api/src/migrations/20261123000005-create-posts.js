"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("posts", {
      affiliateDisclosure: { allowNull: false, defaultValue: false, type: Sequelize.BOOLEAN },
      authorId: {
        onDelete: "SET NULL",
        references: { key: "id", model: "authors" },
        type: Sequelize.UUID,
      },
      body: { type: Sequelize.JSON },
      canonicalUrl: { type: Sequelize.STRING(500) },
      categoryId: {
        allowNull: false,
        onDelete: "RESTRICT",
        references: { key: "id", model: "categories" },
        type: Sequelize.UUID,
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      ctaLabel: { allowNull: false, defaultValue: "Read More", type: Sequelize.STRING(80) },
      externalUrl: { type: Sequelize.STRING(500) },
      featuredImage: { type: Sequelize.STRING(500) },
      gallery: { type: Sequelize.JSON },
      headline: { type: Sequelize.STRING(200) },
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      language: { allowNull: false, defaultValue: "en", type: Sequelize.STRING(10) },
      postType: {
        allowNull: false,
        type: Sequelize.ENUM(
          "editorial",
          "news",
          "link_card",
          "product_recommendation",
          "sponsored",
          "guide",
          "review",
          "comparison",
          "digital_product",
        ),
      },
      publishedAt: { type: Sequelize.DATE },
      seo: { type: Sequelize.JSON },
      slug: { allowNull: false, type: Sequelize.STRING(190), unique: true },
      sourceName: { type: Sequelize.STRING(120) },
      sourceUrl: { type: Sequelize.STRING(500) },
      sponsored: { allowNull: false, defaultValue: false, type: Sequelize.BOOLEAN },
      status: {
        allowNull: false,
        defaultValue: "draft",
        type: Sequelize.ENUM("draft", "review", "published", "scheduled"),
      },
      summary: { type: Sequelize.TEXT },
      title: { allowNull: false, type: Sequelize.STRING(255) },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
      views: { allowNull: false, defaultValue: 0, type: Sequelize.INTEGER },
    });
    await queryInterface.addIndex("posts", ["categoryId"]);
    await queryInterface.addIndex("posts", ["authorId"]);
    await queryInterface.addIndex("posts", ["status", "publishedAt"]);
    await queryInterface.addIndex("posts", ["postType"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("posts");
  },
};
