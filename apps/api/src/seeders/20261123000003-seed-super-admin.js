"use strict";

const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password) {
      // eslint-disable-next-line no-console
      console.log("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping super admin seed.");
      return;
    }
    const now = new Date();
    const passwordHash = await bcrypt.hash(password, 12);
    const adminId = randomUUID();
    await queryInterface.bulkInsert("users", [
      {
        createdAt: now,
        email,
        id: adminId,
        isActive: true,
        name: process.env.SEED_ADMIN_NAME || "Super Admin",
        passwordHash,
        role: "super_admin",
        updatedAt: now,
      },
    ]);
    await queryInterface.bulkInsert("authors", [
      {
        bio: "Editor-in-chief of The Daily Pulse.",
        createdAt: now,
        id: randomUUID(),
        name: process.env.SEED_ADMIN_NAME || "Super Admin",
        role: "Editor-in-Chief",
        slug: "editor-in-chief",
        updatedAt: now,
        userId: adminId,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("authors", { slug: "editor-in-chief" });
    if (process.env.SEED_ADMIN_EMAIL) {
      await queryInterface.bulkDelete("users", { email: process.env.SEED_ADMIN_EMAIL });
    }
  },
};
