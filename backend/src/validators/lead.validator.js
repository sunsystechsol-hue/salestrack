const { z } = require('zod');

const leadStatuses = [
  'NEW',
  'ASSIGNED',
  'CONTACTED',
  'INTERESTED',
  'NOT_INTERESTED',
  'FOLLOW_UP',
  'INQUIRY',
  'CONVERTED',
  'LOST',
];

const createLeadSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).trim().min(1, 'Name cannot be empty'),
  phone: z.string({ required_error: 'Phone is required' }).trim().min(1, 'Phone cannot be empty'),
  email: z.string().email('Invalid email address format').trim().optional().or(z.literal('')),
  source: z.string().trim().optional(),
  course: z.string().trim().optional(),
  city: z.string().trim().optional(),
  formResponseId: z.string().trim().optional(),
  status: z.enum(leadStatuses).optional(),
  assignedToId: z.string().uuid('Invalid user ID format').optional().or(z.literal('')),
  nextFollowUp: z.string().datetime({ message: 'Invalid ISO date string' }).optional().or(z.literal('')),
  notes: z.string().trim().optional(),
});

const updateLeadSchema = z.object({
  name: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  email: z.string().email().trim().optional().or(z.literal('')),
  source: z.string().trim().optional(),
  course: z.string().trim().optional(),
  city: z.string().trim().optional(),
  nextFollowUp: z.string().datetime().optional().nullable(),
  notes: z.string().trim().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(leadStatuses, { required_error: 'Valid lead status is required' }),
});

const assignLeadSchema = z.object({
  assignedToId: z.string({ required_error: 'assignedToId is required' }).uuid('Invalid counsellor ID format'),
});

const leadQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(leadStatuses).optional(),
  assignedToId: z.string().optional(),
  source: z.string().trim().optional(),
  course: z.string().trim().optional(),
  city: z.string().trim().optional(),
});

module.exports = {
  leadStatuses,
  createLeadSchema,
  updateLeadSchema,
  updateStatusSchema,
  assignLeadSchema,
  leadQuerySchema,
};
