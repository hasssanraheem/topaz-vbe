require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const admin = require('../src/config/firebase');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Team = require('../src/models/Team');

const DOMAIN = process.env.SEED_DOMAIN || 'sim.local';

const USERS = [
  {
    label: 'Admin',
    email: `admin@${DOMAIN}`,
    password: process.env.ADMIN_PASSWORD,
    role: 'admin',
    teamNumber: null,
  },
  ...Array.from({ length: 8 }, (_, i) => ({
    label: `Team ${i + 1}`,
    email: `team${i + 1}@${DOMAIN}`,
    password: process.env[`TEAM${i + 1}_PASSWORD`],
    role: 'team',
    teamNumber: i + 1,
  })),
];

async function seedUsers() {
  await connectDB();
  console.log('Starting seed...');

  for (const u of USERS) {
    if (!u.password) {
      console.error(`Missing password env var for ${u.label} — skipping`);
      continue;
    }

    // 1. Upsert Team document (for team users)
    let teamDoc = null;
    if (u.teamNumber !== null) {
      teamDoc = await Team.findOneAndUpdate(
        { teamNumber: u.teamNumber },
        { teamNumber: u.teamNumber, name: u.label },
        { upsert: true, new: true }
      );
    }

    // 2. Upsert Firebase user (create or update)
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(u.email);
      // User exists — update password
      await admin.auth().updateUser(firebaseUser.uid, { password: u.password });
      console.log(`Firebase: updated ${u.email}`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        // Create fresh
        firebaseUser = await admin.auth().createUser({
          email: u.email,
          password: u.password,
          displayName: u.label,
        });
        console.log(`Firebase: created ${u.email}`);
      } else {
        throw err;
      }
    }

    // 3. Set custom claims on Firebase user
    const claims = u.role === 'admin'
      ? { role: 'admin' }
      : { role: 'team', teamNumber: u.teamNumber };
    await admin.auth().setCustomUserClaims(firebaseUser.uid, claims);

    // 4. Upsert MongoDB User document
    await User.findOneAndUpdate(
      { firebaseUid: firebaseUser.uid },
      {
        email: u.email,
        firebaseUid: firebaseUser.uid,
        role: u.role,
        team: teamDoc ? teamDoc._id : null,
      },
      { upsert: true, new: true }
    );

    console.log(`MongoDB: upserted user ${u.email} (${u.role})`);
  }

  console.log('Seed complete.');
  await mongoose.disconnect();
  process.exit(0);
}

seedUsers().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
