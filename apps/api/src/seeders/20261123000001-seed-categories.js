"use strict";

const { randomUUID } = require("crypto");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert("categories", [
      {
        description: "Wellness, travel, food and everyday living.",
        id: randomUUID(),
        isVertical: true,
        name: "Lifestyle",
        order: 0,
        slug: "lifestyle",
        createdAt: now,
        updatedAt: now,
      },
      {
        description: "Money, markets, tax and personal finance.",
        id: randomUUID(),
        isVertical: true,
        name: "Personal Finance",
        order: 1,
        slug: "personal-finance",
        createdAt: now,
        updatedAt: now,
      },
      {
        description: "Gadgets, AI, startups and the future of tech.",
        id: randomUUID(),
        isVertical: true,
        name: "Technology",
        order: 2,
        slug: "technology",
        createdAt: now,
        updatedAt: now,
      },
      {
        description: "Developing stories as they happen.",
        id: randomUUID(),
        isVertical: true,
        name: "Breaking News",
        order: 3,
        slug: "breaking-news",
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("categories", {
      slug: ["lifestyle", "personal-finance", "technology", "breaking-news"],
    });
  },
};
