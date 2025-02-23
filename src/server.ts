
import express from 'express';
import ModelClient from './modelClient';
import { complianceRequestSchema } from './schema';
import TextExtraction from './textExtraction';

const app = express();
app.use(express.json());

// Initialize Gemini model client
const modelClient = new ModelClient();

app.post('/check-compliance', async (req, res): Promise<any> => {
  try {
    const parsedReq = complianceRequestSchema.safeParse(req.body);

    if(!parsedReq.success){
      // handle invalid request and format zod error
      const errors = parsedReq.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({ error: 'Invalid request body', details: errors });
    }

    const { webpageUrl, policyUrl } = parsedReq.data;

    const policyText = await TextExtraction.extractPolicyText(policyUrl);
    const webpageText = await TextExtraction.extractWebpageText(webpageUrl);
    
    const findings = await modelClient.checkCompliance(policyText, webpageText);

    const isCompliant = findings.length === 0;
    const summary = isCompliant
      ? 'The webpage is fully compliant with the policy.'
      : `The webpage has ${findings.length} violation(s). Please review the findings for details.`;

    res.json({ findings, isCompliant, summary });
  } catch (error: any) {
    console.error('Error in check-compliance API endpoint:', error);
    res.status(500).json({ error: error.message || 'An unexpected error occurred' });
  }
});

// Start server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});