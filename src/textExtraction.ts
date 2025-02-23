import { Readability } from '@mozilla/readability';
import axios from 'axios';
import { htmlToText } from 'html-to-text';
import { JSDOM } from 'jsdom';

/**
 * @description Fetches the HTML as a string from website URL
 * @param {string} url 
 * @returns {string} 
 */
export async function fetchHtmlFromUrl(url: string) {
  try {
    const response = await axios.get(url, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3' // Mimic a browser
      }
    });

    if (typeof response.data === 'string') {
      return response.data;
    } else {
      throw new Error('Response is not HTML');
    }
  } catch (error: any) {
    throw new Error(`Failed to fetch HTML: ${error.message}`);
  }
}

/**
 * @description Cleans the HTML and extracts the main content from the webpage
 * @param {string} url 
 * @returns {string} 
 */
async function extractMainContentHtml(url: string): Promise<string> {
  try{
    const response = await fetchHtmlFromUrl(url);
    const dom = new JSDOM(response, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (!article) throw new Error('Failed to extract main content');
    return article.content;
  }
  catch(error: any){
    if (axios.isAxiosError(error)) {
      throw new Error(`Network error while fetching ${url}: ${error.message}`);
    }
    throw new Error(`Failed to extract content from ${url}: ${error.message}`);

  }
}

/**
 * @description Converts the HTML to text with section markers  
 * @param {string} html 
 * @returns {string} 
 */
function convertHtmlToTextWithSections(html: string): string {
  try{
    return htmlToText(html, {
      formatters: {
        heading: (elem, fn, options) => {
          const headingText = fn(elem.children, options)
          const level = parseInt(elem.name ? elem.name[1] : '', 10);
          const prefix = level === 1 ? 'Section' : level === 2 ? 'Subsection' : 'Subsubsection';
          return `\n\n[${prefix}: ${headingText}]\n\n`;
        },
      },
      selectors: [
        { selector: 'h1', format: 'heading', options: { uppercase: false } },
        { selector: 'h2', format: 'heading', options: { uppercase: false } },
        { selector: 'h3', format: 'heading', options: { uppercase: false } },
      ],
      wordwrap: false,
    }).trim();
  }catch (error: any) {
    throw new Error(`Failed to convert HTML to text: ${error.message}`);
  }

}

/**
 * @description Fetches the policy text from the URL
 * @param {string} policyUrl 
 * @returns {string} 
 */
async function extractPolicyText(policyUrl: string): Promise<string> {
  try{
    const response = await extractMainContentHtml(policyUrl);
    return convertHtmlToTextWithSections(response);
  }
  catch(error: any){
    if (axios.isAxiosError(error)) {
      throw new Error(`Network error fetching policy from ${policyUrl}: ${error.message}`);
    }
    throw new Error(`Failed to extract policy from ${policyUrl}: ${error.message}`);
  }
}

/**
 * @description Fetches and extracts the main content from the webpage
 * @param {string} websiteUrl 
 * @returns {string} 
 */
async function extractWebpageText(websiteUrl: string): Promise<string> {
  try{
    const mainContentHtml = await extractMainContentHtml(websiteUrl);
    return convertHtmlToTextWithSections(mainContentHtml);
  }
  catch(error: any){
    if (axios.isAxiosError(error)) {
      throw new Error(`Network error fetching webpage from ${websiteUrl}: ${error.message}`);
    }
    throw new Error(`Failed to extract webpage from ${websiteUrl}: ${error.message}`);
  }
}

export default { extractPolicyText, extractWebpageText };