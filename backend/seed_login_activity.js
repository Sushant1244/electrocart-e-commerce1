require('dotenv').config();
const { connectDB, closeDB } = require('./config/db');
const User = require('./models/mongo/User');
const LoginActivity = require('./models/mongo/LoginActivity');

async function seedLoginActivity() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');
  await connectDB();
  const users = await User.find().select('email').limit(10).lean();
  if (!users.length) throw new Error('Create at least one user before seeding login activity');
  const rows = [];
  for (let day = 0; day < 30; day += 1) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    date.setHours(10, 0, 0, 0);
    const user = users[day % users.length];
    rows.push({ userId: user._id, email: user.email, ipAddress: `192.0.2.${(day % 20) + 1}`, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0', device: { type: 'desktop', browser: 'Chrome', os: 'macOS' }, status: 'success', createdAt: date });
    if (day % 4 === 0) rows.push({ userId: user._id, email: user.email, ipAddress: `198.51.100.${(day % 20) + 1}`, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148', device: { type: 'mobile', browser: 'Safari', os: 'iOS' }, status: 'failed', createdAt: new Date(date.getTime() + 60 * 60 * 1000) });
  }
  await LoginActivity.insertMany(rows);
  console.log(`Inserted ${rows.length} sample login activity records.`);
}

seedLoginActivity().catch(error => { console.error('Login activity seed failed:', error.message); process.exitCode = 1; }).finally(async () => { await closeDB(); });
