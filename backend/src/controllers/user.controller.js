const prisma = require('../utils/prisma');

/**
 * GET /api/users/counsellors
 * Returns active counsellors for lead assignment dropdowns.
 * Accessible to ADMIN and MANAGER roles.
 */
const getCounsellors = async (req, res, next) => {
  try {
    const counsellors = await prisma.user.findMany({
      where: {
        role: 'COUNSELLOR',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json(counsellors);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCounsellors,
};
