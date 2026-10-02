// Seeds 8 company (Team) documents + one Session into MongoDB.
// Safe to re-run — existing documents are not duplicated (upsert).

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Team    = require('../src/models/Team');
const Session = require('../src/models/Session');
const User    = require('../src/models/User');

const COMPANY_NAMES = [
  'Alpha Manufacturing',
  'Beta Industries',
  'Gamma Traders',
  'Delta Works',
  'Epsilon Engineering',
  'Zeta Industries',
  'Eta Manufacturing',
  'Theta Works',
];

async function run() {
  await connectDB();

  // Find admin user to set as session creator
  const adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) throw new Error('No admin user found — run reset-users.js first');

  // Upsert 8 teams
  for (let i = 0; i < 8; i++) {
    const teamNumber = i + 1;
    await Team.findOneAndUpdate(
      { teamNumber },
      { $setOnInsert: { teamNumber, name: COMPANY_NAMES[i], active: true } },
      { upsert: true, new: true }
    );
    console.log(`  Team ${teamNumber}: ${COMPANY_NAMES[i]}`);
  }

  // Upsert one active session
  const existing = await Session.findOne();
  if (!existing) {
    await Session.create({
      name:           'Topaz-VBE Demo',
      simulationCode: 'TOPAZ-DEMO',
      groupNumber:    '1',
      startYear:      2024,
      startQuarter:   1,
      createdBy:      adminUser._id,
    });
    console.log('  Session created: TOPAZ-DEMO');
  } else {
    console.log('  Session already exists:', existing.simulationCode);
  }

  console.log('\nSeed complete.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
