import { z } from 'zod';

// Define the schema for the request body
export const complianceRequestSchema = z.object({
  webpageUrl: z.string().url({ message: 'webpageUrl must be a valid URL' }).nonempty('webpageUrl is required'),
  policyUrl: z.string().url({ message: 'policyUrl must be a valid URL' }).nonempty('policyUrl is required'),
});
