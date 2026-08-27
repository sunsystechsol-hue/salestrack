const { z } = require('zod');

const webhookPayloadSchema = z.object({
  formResponseId: z
    .string({ required_error: 'formResponseId is required' })
    .trim()
    .min(1, 'formResponseId cannot be empty'),
  name: z
    .string({ required_error: 'name is required' })
    .trim()
    .min(1, 'name cannot be empty'),
  phone: z
    .string({ required_error: 'phone is required' })
    .trim()
    .min(1, 'phone cannot be empty'),
  email: z.string().email('Invalid email format').trim().optional().or(z.literal('')),
  course: z.string().trim().optional(),
  city: z.string().trim().optional(),
});

module.exports = {
  webhookPayloadSchema,
};
