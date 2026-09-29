require('dotenv').config();

const connectDB = require('../config/db');
const { seedDefaultData } = require('../utils/seed');

async function runSeed() {
  try {
    if (process.env.NODE_ENV === 'production') throw new Error('Demo seed command is disabled in production');
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
