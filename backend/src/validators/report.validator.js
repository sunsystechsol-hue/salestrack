const { z } = require('zod');

const dateRanges = ['TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'THIS_MONTH', 'CUSTOM'];

const reportQuerySchema = z.object({
  range: z.enum(dateRanges).optional().default('TODAY'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  counsellorId: z.string().optional(),
  status: z.string().optional(),
  outcome: z.string().optional(),
  format: z.enum(['json', 'csv']).optional().default('json'),
  type: z.enum(['performance', 'attendance', 'calls', 'followups', 'tasks']).optional(),
  page: z.union([z.string(), z.number()]).optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.union([z.string(), z.number()]).optional().transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 20)),
});

module.exports = {
  reportQuerySchema,
  dateRanges,
};
