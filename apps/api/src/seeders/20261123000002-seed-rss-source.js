"use strict";

const { randomUUID } = require("crypto");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert("rssSources", [
      {
        active: true,
        category: "breaking-news",
        createdAt: now,
        fetchIntervalMinutes: 15,
        id: randomUUID(),
        lastItemCount: 0,
        lastFetchedAt: null,
        name: "Economic Times — B2B",
        updatedAt: now,
        url: "https://b2b.economictimes.indiatimes.com/rss",
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("rssSources", {
      url: "https://b2b.economictimes.indiatimes.com/rss",
    });
  },
};
