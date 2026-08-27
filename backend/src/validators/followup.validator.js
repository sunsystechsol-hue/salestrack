const { z } = require('zod');

const followupQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 20)),
  status: z.enum(['PENDING', 'TODAY', 'OVERDUE', 'COMPLETED']).optional(),
  counsellorId: z.string().optional(),
  leadId: z.string().optional(),
});

module.exports = {
  followupQuerySchema,
};
