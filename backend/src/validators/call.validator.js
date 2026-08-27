const { z } = require('zod');

const callOutcomes = [
  'INTERESTED',
  'NOT_INTERESTED',
  'FOLLOW_UP_REQUIRED',
  'INQUIRY',
  'CALL_BACK',
  'NO_RESPONSE',
  'WRONG_NUMBER',
  'CONVERTED',
  'OTHER',
];

const createCallSchema = z.object({
  leadId: z.string().uuid({ message: 'Valid leadId UUID is required' }),
  calledAt: z.string().optional(),
  durationSec: z.number().min(0, { message: 'durationSec must be a non-negative integer' }).default(0),
  outcome: z.enum(callOutcomes, { message: 'Invalid call outcome' }),
  remarks: z.string().max(2000, { message: 'Remarks must not exceed 2000 characters' }).optional(),
  nextFollowUp: z.string().optional().nullable(),
});

const callQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 20)),
  leadId: z.string().optional(),
  outcome: z.enum(callOutcomes).optional(),
});

module.exports = {
  createCallSchema,
  callQuerySchema,
  callOutcomes,
};
