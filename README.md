# Compliance checker

Problem: [https://gist.github.com/ramkumarvenkat/b7026550e859f5881c937d9aaed8bc84](https://gist.github.com/ramkumarvenkat/b7026550e859f5881c937d9aaed8bc84)

### I have divided the problem into the following sub-problems 

1. Scraping text content from a given webpage (for both URL and Policy URL)
    - This is fairly simple and I have used a GET request for both the URLs to get the HTML as a string for further processing 
2. Pre-processing text for comprehensive results that help in identifying faulty sections 
    - Utilising Mozilla's readability package to get only the text content of the webpage and then converting the HTML to sections so that the LLM can include the position of faulty text in the webpage and the corresponding section of the policy in the result (Check Results)
3. Prompting LLM for compliance checking
    - Choosing the model based on its context window and cost (Gemini has a context window on approx 2M tokens and it is free to use for the scope of this API)
    - Make sure the compliance check is strict so that the non-compliant parts are identified 
4. Error handling 
    - Added request validation and verbose errors

### Try out the solution
- Deployment link: https://compliance-checker-kappa.vercel.app/check-compliance
- Testing with curl

```bash
curl -X POST "https://compliance-checker-kappa.vercel.app/check-compliance" -H "Content-Type: application/json" -d '{"webpageUrl": "https://www.mercury.com/","policyUrl": "https://stripe.com/docs/treasury/marketing-treasury"}'
```

- Run it locally

    1. Clone the repo, add Google AI studio API key to the .env (check the .env.template)
    2. `npm run install`
    3. `npm run dev`

### Frameworks used:

1. Text extraction, cleaning and pre-processing: [html-to-text](https://www.npmjs.com/package/html-to-text), [jsdom](https://www.npmjs.com/package/jsdom), [@mozzila/readability](https://www.npmjs.com/package/@mozilla/readability), axios
2. LLM - [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai)
3. Server and validation - express and [zod](https://www.npmjs.com/package/zod)

### Code Description:

<b>server.ts</b> - Contains the POST route and handles the request validation and response formatting

<b>textExtraction.ts</b> - Contains methods and utilities for fetching HTML from the URL, and cleaning and pre-processing the text content on a webpage.

<b>modelClient.ts</b> - Contains a class (single instance instantiated at server start) which creates a prompt and queries Gemini 

## Results:

### Test case 1
- Policy URL:  [https://stripe.com/docs/treasury/marketing-treasury](https://stripe.com/docs/treasury/marketing-treasury)
- Webpage URL: [https://www.brex.com/](https://www.brex.com/)
- Result: 

```json
{
    "findings": [
        {
            "webpageSection": "First Paragraph",
            "violatingText": "Vault accounts allow customers to sweep cash into program banks.",
            "policySection": "Terms to Avoid",
            "policyPart": "Phrases that suggest your users receive banking products or services directly from bank partners",
            "suggestion": "Rephrase to avoid implying direct access to bank accounts. For example, \"Vault accounts allow customers to transfer funds to partner financial institutions\" or \"Vault accounts allow customers to move funds into program accounts.\""
        },
        {
            "webpageSection": "Fifth Paragraph",
            "violatingText": "The Brex business account consists of Checking, a commercial demand deposit account offered by Column N.A. (“Column”), member FDIC, and Treasury and Vault, which are cash management services offered by Brex Treasury LLC (“Brex Treasury”), member FINRA/SIPC, an affiliate of Brex. Brex is a financial technology company, not a bank. Checking accounts and banking services are provided by Column.",
            "policySection": "Terms to Avoid",
            "policyPart": "Banking Services",
            "suggestion": "Replace \"banking services\" with a compliant term like \"financial services\" or specify the exact service provided by Column, for example, \"Checking accounts and deposit account services are provided by Column.\""
        }
    ],
    "isCompliant": false,
    "summary": "The webpage has 2 violation(s). Please review the findings for details."
}
```

### Test case 2
- Policy URL:  [https://stripe.com/docs/treasury/marketing-treasury](https://stripe.com/docs/treasury/marketing-treasury)
- Webpage URL: [https://www.mercury.com/](https://www.mercury.com/)
- Result: 

```json
{
    "findings": [
        {
            "webpageSection": "Main Headline",
            "violatingText": "Powerful banking. Simplified finances.",
            "policySection": "Recommended Terms",
            "policyPart": "Terms to Avoid",
            "suggestion": "Replace \"banking\" with a compliant term like \"financial management\" or \"money management.\" Suggested headline: \"Powerful financial management. Simplified finances.\""
        },
        {
            "webpageSection": "Introductory Paragraph",
            "violatingText": "Apply in 10 minutes for online business banking that transforms how you operate.",
            "policySection": "Recommended Terms",
            "policyPart": "Terms to Avoid",
            "suggestion": "Replace \"business banking\" with \"business financial services\" or \"a business financial account.\" Suggested text: \"Apply in 10 minutes for online business financial services that transform how you operate.\""
        },
        {
            "webpageSection": "Speed without compromise",
            "violatingText": "Efficiently manage your banking and financial operations from a single dashboard.",
            "policySection": "Recommended Terms",
            "policyPart": "Terms to Avoid",
            "suggestion": "Replace \"banking\" with \"money management\" or \"cash management.\" Suggested text: \"Efficiently manage your money management and financial operations from a single dashboard.\""
        },
        {
            "webpageSection": "Complete any banking task in just a few clicks",
            "violatingText": "banking",
            "policySection": "Recommended Terms",
            "policyPart": "Terms to Avoid",
            "suggestion": "Replace \"banking task\" with \"financial task\" or a more specific action like \"paying bills\" or \"managing transactions.\" Suggested text: \"Complete any financial task in just a few clicks.\""
        },
        {
            "webpageSection": "Checking & Savings",
            "violatingText": "Checking & Savings",
            "policySection": "Recommended Terms",
            "policyPart": "Terms to Avoid",
            "suggestion": "While these terms are generally accepted, in this specific context of a Stripe Treasury implementation, it is recommended to use alternative terminology to avoid any regulatory scrutiny. Replace with \"Money Management Accounts\" or \"Financial Accounts.\""
        },
        {
            "webpageSection": "Bank with complete confidence",
            "violatingText": "Bank with complete confidence",
            "policySection": "Recommended Terms",
            "policyPart": "Terms to Avoid",
            "suggestion": "Replace \"Bank\" with \"Manage your finances\" or similar. Suggested text: \"Manage your finances with complete confidence.\""
        },
        {
            "webpageSection": "Bank with complete confidence",
            "violatingText": "20× the industry standard in FDIC insurance through our partner banks and sweep networks.",
            "policySection": "How to talk about FDIC insurance eligibility",
            "policyPart": "Don't use the following terms: “FDIC insured”",
            "suggestion": "Rephrase to emphasize eligibility, not a guarantee.  Include required disclosures. Example: \"Eligible for up to 20× the industry standard in FDIC pass-through insurance through our partner banks and sweep networks. Stripe Treasury Accounts are eligible for FDIC pass-through deposit insurance if they meet certain requirements...[include full required disclosure]\""
        },
        {
            "webpageSection": "All your financial workflows. Zero complexity.",
            "violatingText": "When your bank account powers your critical financial workflows, you’re already in the flow.",
            "policySection": "Recommended Terms",
            "policyPart": "Terms to Avoid: Bank account",
            "suggestion": "Replace \"bank account\" with \"financial account\" or \"money management account.\" Suggested text: \"When your financial account powers your critical financial workflows, you’re already in the flow.\""
        },
        {
            "webpageSection": "Mercury",
            "violatingText": "FDIC-insured bank accounts",
            "policySection": "How to talk about FDIC insurance eligibility",
            "policyPart": "Don't use the following terms: “FDIC insured accounts”",
            "suggestion": "Replace with \"Accounts eligible for FDIC pass-through insurance\" and include the required disclosures about eligibility requirements and limitations."
        },
        {
            "webpageSection": "Mercury Plus",
            "violatingText": "FDIC-insured bank accounts",
            "policySection": "How to talk about FDIC insurance eligibility",
            "policyPart": "Don't use the following terms: “FDIC insured accounts”",
            "suggestion": "Replace with \"Accounts eligible for FDIC pass-through insurance\" and include the required disclosures about eligibility requirements and limitations."
        },
        {
            "webpageSection": "Mercury Pro",
            "violatingText": "FDIC-insured bank accounts",
            "policySection": "How to talk about FDIC insurance eligibility",
            "policyPart": "Don't use the following terms: “FDIC insured accounts”",
            "suggestion": "Replace with \"Accounts eligible for FDIC pass-through insurance\" and include the required disclosures about eligibility requirements and limitations."
        },
        {
            "webpageSection": "Unlimited 1.5% cashback on all spend.",
            "violatingText": "1.5% cashback",
            "policySection": "Cash back compliance marketing guidance",
            "policyPart": "Always disclose prominently in your marketing materials that the cash back program is subject to change and the conditions under which it might change.",
            "suggestion": "Add a disclaimer stating that the cashback program is subject to change. For example, \"Unlimited 1.5% cashback on all spend (subject to change).\""
        }
    ],
    "isCompliant": false,
    "summary": "The webpage has 12 violation(s). Please review the findings for details."
}
```

Test case 3
- Policy URL: [https://stripe.com/docs/treasury/marketing-treasury](https://stripe.com/docs/treasury/marketing-treasury)
- Webpage URL: [https://www.stripe.com/](https://www.stripe.com/)
- Result: 

```json
{
    "findings": [],
    "isCompliant": true,
    "summary": "The webpage is fully compliant with the policy."
}
```

Test case 4
- Policy URL: [https://support.google.com/adspolicy/answer/6008942?hl=en#con](https://support.google.com/adspolicy/answer/6008942?hl=en#con)
- Webpage URL: [https://www.vice.com/](https://www.vice.com/)
- Result: 

```json
{
    "findings": [
        {
            "webpageSection": "Main Content",
            "violatingText": "One email. One story. Every week. Sign up for the VICE newsletter.",
            "policySection": "Data collection and use",
            "policyPart": "Examples of user information that should be handled with care (non-exhaustive): full name; email address; mailing address; phone number; national identity, pension, social security, tax ID, health care, or driver's license number; birth date or mother's maiden name in addition to any of the above information; financial status; political affiliation; sexual orientation; race or ethnicity; religion",
            "suggestion": "The webpage promotes signing up for a newsletter, which inherently involves collecting email addresses.  While collecting email addresses is not prohibited, the policy emphasizes the careful handling of user information. The webpage needs to clearly articulate how the collected email addresses will be used and how user privacy will be protected.  Add a concise statement near the signup button assuring users that their email addresses will only be used for newsletter distribution and will not be shared with third parties without their explicit consent.  For example: \"Your email address will only be used to send you the VICE newsletter. We respect your privacy and will not share your information.\""
        },
        {
            "webpageSection": "Main Content",
            "violatingText": "& to receive electronic communications from VICE Media Group, which may include marketing promotions, advertisements and sponsored content.",
            "policySection": "Data collection and use",
            "policyPart": "Examples of irresponsible data collection & use (non-exhaustive): obtaining credit card information over a non-secure server, promotions that claim to know a user's sexual orientation or financial status, violations of our policies that apply to interest-based advertising and remarketing",
            "suggestion": "The phrase \"marketing promotions, advertisements and sponsored content\" could be interpreted as a lack of transparency regarding the specific types of ads users might receive.  While not explicitly prohibited, it's best practice to be more specific to ensure compliance and user trust. Modify the sentence to provide more clarity about the types of marketing communications users will receive. For example, specify the general themes of the promotions (e.g., related to VICE content, cultural events, etc.) and clearly distinguish between advertisements from VICE and sponsored content from third-party partners. Example: \"...receive electronic communications, including the VICE newsletter,  updates on VICE events, and advertisements related to VICE content.  You may also receive sponsored content from select partners.\"  Additionally, provide users with a clear and easy mechanism to opt out of specific types of communications (e.g., sponsored content) if they choose."
        }
    ],
    "isCompliant": false,
    "summary": "The webpage has 2 violation(s). Please review the findings for details."
}
```

### Improvements: 

1. <b>Handling webpages with large text corpus</b>: This can be handled by chunking the website content into chunks and checking every chunk for policy compliance and aggregating results for all chunks. 
2. <b>Reducing API’s latency</b>: This can be achieved by storing the policy (after the pre-processing) in the cache, we can also try a smaller model that offers a lower inference latency (like Gemini 2.0-Flash or GPT-4o mini)
3. <b>Streaming response</b>: in a practical scenario, it would be ideal to stream the responses of the chunks (mentioned in improvement 1) as when they are processed