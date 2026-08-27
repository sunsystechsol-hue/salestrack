const bcrypt = require('bcrypt');
const { loginSchema } = require('../validators/auth.validator');
const { signToken } = require('../utils/jwt');
const prisma = require('../utils/prisma');

/**
 * POST /api/auth/login
 * Handles user login using email and password, and records server-side attendance & presence.
 */
const login = async (req, res, next) => {
  try {
    // 1. Zod Validation
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      const issues = validationResult.error.issues || validationResult.error.errors || [];
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid login payload',
        details: issues.map((e) => ({
          field: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
          message: e.message,
        })),
      });
    }

    const { email, password } = validationResult.data;

    // 2. Find User by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // 3. Check isActive
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Account is inactive. Please contact your system administrator.',
      });
    }

    // 4. Compare password with passwordHash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // 5. Record Server-Side Attendance (Asia/Kolkata timezone safe) & initial lastSeenAt
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const workDate = new Date(`${todayStr}T00:00:00.000Z`);

    try {
      await prisma.attendance.upsert({
        where: {
          userId_workDate: {
            userId: user.id,
            workDate,
          },
        },
        update: {
          lastSeenAt: now,
          updatedAt: now,
        },
        create: {
          userId: user.id,
          workDate,
          loginAt: now,
          lastSeenAt: now,
        },
      });
    } catch (attErr) {
      console.error('[Attendance] Login attendance upsert warning:', attErr.message);
    }

    // 6. Generate JWT token
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // 7. Return response without passwordHash or internal secrets
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
};
