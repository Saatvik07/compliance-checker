import { z } from 'zod';
import { complianceRequestSchema } from './schema';

// Infer the TypeScript type from the schema
export type TComplianceRequest = z.infer<typeof complianceRequestSchema>;

export type TComplianceFinding = {
    webpageSection: string;
    violatingText: string;
    policySection: string;
    policyPart: string;
    suggestion: string
}