"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert("seoSettings", [
      {
        defaultDescription:
          "The Daily Pulse — original reporting and curated news across lifestyle, personal finance, technology and breaking news.",
        defaultTitle: "The Daily Pulse — Lifestyle, Finance, Technology & Breaking News",
        googleNewsEnabled: true,
        id: "default",
        updatedAt: now,
      },
    ]);
    await queryInterface.bulkInsert("siteSettings", [
      {
        id: "default",
        primaryColor: "#1d4ed8",
        siteName: "The Daily Pulse",
        tagline: "News that keeps pace with your day.",
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("seoSettings", { id: "default" });
    await queryInterface.bulkDelete("siteSettings", { id: "default" });
  },
};
