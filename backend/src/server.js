require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const leadRoutes = require('./routes/lead.routes');
const integrationRoutes = require('./routes/integration.routes');
const userRoutes = require('./routes/user.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const callRoutes = require('./routes/call.routes');
const followupRoutes = require('./routes/followup.routes');
const taskRoutes = require('./routes/task.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reportRoutes = require('./routes/report.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy headers (Render, Cloudflare, NGINX)
app.set('trust proxy', 1);

// Security & Middleware
app.use(helmet());

const corsOriginSetting = process.env.CORS_ORIGIN;
const allowedOrigins = corsOriginSetting
  ? corsOriginSetting.split(',').map((origin) => origin.trim())
  : null;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!allowedOrigins || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

const bcrypt = require('bcrypt');
const prisma = require('./utils/prisma');

async function ensureSeedUsers() {
  try {
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@kaushalsaathi.com';
    const adminPass = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
    const adminHash = await bcrypt.hash(adminPass, 10);

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash: adminHash,
        role: 'ADMIN',
        isActive: true,
      },
      create: {
        name: 'System Admin',
        email: adminEmail,
        phone: '9999999991',
        passwordHash: adminHash,
        role: 'ADMIN',
        isActive: true,
      },
    });

    const managerEmail = process.env.SEED_MANAGER_EMAIL || 'manager@kaushalsaathi.com';
    const managerPass = process.env.SEED_MANAGER_PASSWORD || 'Manager@12345';
    const managerHash = await bcrypt.hash(managerPass, 10);

    await prisma.user.upsert({
      where: { email: managerEmail },
      update: {
        passwordHash: managerHash,
        role: 'MANAGER',
        isActive: true,
      },
      create: {
        name: 'Sales Manager',
        email: managerEmail,
        phone: '9999999992',
        passwordHash: managerHash,
        role: 'MANAGER',
        isActive: true,
      },
    });

    console.log('[Bootstrap] Seed users verified successfully.');
  } catch (err) {
    console.warn('[Bootstrap] Seed user verification warning:', err.message);
  }
}

// Only listen if not required by tests
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`[Server] KaushalSaathi Tracker Backend running on port ${PORT} (${process.env.NODE_ENV || 'development'} mode)`);
    await ensureSeedUsers();
  });
}

module.exports = app;
