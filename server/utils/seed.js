const bcrypt = require("bcryptjs");
const User = require("../models/User");
const SystemSetting = require("../models/SystemSetting");

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@rideon.com";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";

async function ensureDefaultAdmin() {
  const email = DEFAULT_ADMIN_EMAIL.trim().toLowerCase();

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.role !== "admin") {
      existingUser.role = "admin";
      await existingUser.save();
      console.log("Admin role granted to existing user ✅");
    }

    return existingUser;
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

  const adminUser = await User.create({
    name: "RideOn Admin",
    email,
    password: hashedPassword,
    phone: "+919999999999",
    role: "admin",
  });

  console.log(`Default admin created: ${email} ✅`);

  return adminUser;
}

async function ensurePlatformSettings() {
  const payload = {
    key: "platform",
    commissionPercentage: 10,
    fixedCommission: 200,
    platformFee: 50,
    isActive: true,
  };

  const settings = await SystemSetting.findOneAndUpdate(
    { key: "platform" },
    payload,
    { upsert: true, new: true, runValidators: true }
  );

  console.log("Platform settings ensured ✅");

  return settings;
}

async function seedDefaultData() {
  try {
    await ensureDefaultAdmin();
    await ensurePlatformSettings();
  } catch (error) {
    console.error("Seed failed ❌:", error.message);
  }
}

module.exports = {
  ensureDefaultAdmin,
  ensurePlatformSettings,
  seedDefaultData,
};
