require('dotenv').config();

const connectDB = require('../config/db');
const { seedDefaultData } = require('../utils/seed');

async function runSeed() {
  try {
    await connectDB();
    await seedDefaultData();
    console.log('Seed completed successfully ✅');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed ❌', error);
    process.exit(1);
  }
}

runSeed();
