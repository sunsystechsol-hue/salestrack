const { z } = require('zod');

const attendanceQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 20)),
  workDate: z.string().optional(),
  userId: z.string().optional(),
});

module.exports = {
  attendanceQuerySchema,
};
