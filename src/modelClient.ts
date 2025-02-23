import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { TComplianceFinding } from './types';

dotenv.config();

class ModelClient {
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;
    private modelName: string;

    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        this.modelName = 'gemini-1.5-pro';
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });
    }

    getPrompt(policyText: string, webpageText: string): string {
        return `
        You are a strict compliance checker. Here is the compliance policy, divided into sections:

        ${policyText}

        And here is the main content of the webpage, also divided into sections:

        ${webpageText}

        Carefully analyze the webpage content against the policy. For each violation, provide a JSON object with:
        - "webpageSection": the section of the webpage where the violation occurs
        - "violatingText": the exact text that violates the policy
        - "policySection": the section of the policy that is violated
        - "policyPart": the specific part of the policy that is violated
        - "suggestion": a detailed suggestion on how to make the text compliant, including alternative phrasing or actions to take

        Return a JSON array of such objects. If there are no violations, return an empty array.

        Ensure the output is a valid JSON array without any additional text.
        `
    }

    /**
     * @description Checks compliance with the policy
     * @param {string} policyText 
     * @param {string} webpageText 
     * @returns {Promise<any[]>} 
     */
    async checkCompliance(policyText: string, webpageText: string): Promise<Array<TComplianceFinding>> {
        try{
            const prompt = this.getPrompt(policyText, webpageText);
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text().trim();
            const findings = JSON.parse(responseText);
            if (!Array.isArray(findings)) throw new Error('Response is not an array');
            return findings;
        }
        catch(error){
            throw new Error(`Model client error for`)
        }

    }
}

export default ModelClient;
    
