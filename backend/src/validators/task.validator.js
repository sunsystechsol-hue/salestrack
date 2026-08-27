const { z } = require('zod');

const taskStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const dueFilters = ['PENDING', 'TODAY', 'OVERDUE', 'COMPLETED', 'ALL'];

const createTaskSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }).max(200, { message: 'Title must not exceed 200 characters' }),
  description: z.string().max(2000, { message: 'Description must not exceed 2000 characters' }).optional().nullable(),
  dueAt: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Valid dueAt date string is required' }),
  userId: z.string().uuid({ message: 'Valid userId UUID is required' }),
  leadId: z.string().uuid({ message: 'Valid leadId UUID is required' }).optional().nullable(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  dueAt: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Valid dueAt date' }).optional(),
  status: z.enum(taskStatuses).optional(),
  userId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional().nullable(),
});

const updateTaskStatusSchema = z.object({
  status: z.enum(taskStatuses, { message: 'Invalid task status' }),
});

const reassignTaskSchema = z.object({
  userId: z.string().uuid({ message: 'Valid target userId UUID is required' }),
});

const taskQuerySchema = z.object({
  page: z.union([z.string(), z.number()]).optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.union([z.string(), z.number()]).optional().transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 20)),
  status: z.enum(taskStatuses).optional(),
  userId: z.string().optional(),
  leadId: z.string().optional(),
  search: z.string().optional(),
  due: z.enum(dueFilters).optional(),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  reassignTaskSchema,
  taskQuerySchema,
  taskStatuses,
  dueFilters,
};
