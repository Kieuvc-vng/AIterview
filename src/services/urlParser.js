const axios = require('axios');
// const cheerio = require('cheerio'); // Removed due to compatibility issues

/**
 * Parse VNG Careers job URL and extract job title, department, and description
 */
async function parseJobURL(jobUrl) {
  try {
    // Validate URL format
    if (!jobUrl.includes('career.vng.com.vn')) {
      throw new Error('Invalid URL. Please use a URL from career.vng.com.vn');
    }

    // Fetch the page HTML
    const response = await axios.get(jobUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const html = response.data;
    const pageText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Extract job title from HTML title tag or og:title meta tag
    let jobTitle = 'Unknown Job Title';
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      jobTitle = titleMatch[1].trim();
    }
    const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    if (ogTitleMatch) {
      jobTitle = ogTitleMatch[1].trim();
    }

    // Extract department - look for department info in the page text
    let department = '';
    const deptPatterns = [
      /Phòng ban:\s*([A-Z0-9]+)/i,
      /Department:\s*([A-Z0-9]+)/i,
      /department[:\s]*([A-Z0-9]+)/i,
      /\b(GDS|PEN|PRO|GS3|GIO)\b/i
    ];

    for (const pattern of deptPatterns) {
      const match = pageText.match(pattern);
      if (match) {
        department = match[1] ? match[1].toUpperCase() : match[0].toUpperCase();
        break;
      }
    }

    // Extract job code - pattern: XX-XXX-XXXX or similar
    let jobCode = '';
    const codePatterns = [
      /\b([A-Z0-9]{2,3}-[A-Z0-9]{3,4}-[0-9]{3,4})\b/i,
      /Code:\s*([A-Z0-9\-]+)/i,
      /Mã vị trí:\s*([A-Z0-9\-]+)/i,
      /Job Code:\s*([A-Z0-9\-]+)/i
    ];

    for (const pattern of codePatterns) {
      const match = pageText.match(pattern);
      if (match) {
        jobCode = match[1].toUpperCase();
        break;
      }
    }

    // Extract department from job code - middle part between hyphens
    let departmentFromCode = '';
    if (jobCode) {
      const codeParts = jobCode.split('-');
      if (codeParts.length >= 2) {
        departmentFromCode = codeParts[1];
      }
    }

    // Extract job description - first 2000 chars of page text
    const jobDescription = pageText.substring(0, 2000);
    const finalDepartment = departmentFromCode || department || 'Unknown';

    return {
      job_title: jobTitle || 'Unknown Job Title',
      job_code: jobCode || 'Unknown',
      department: finalDepartment,
      job_description: jobDescription,
      source_url: jobUrl
    };
  } catch (error) {
    console.error('[urlParser] Error parsing URL:', error.message);
    throw new Error(`Failed to parse URL: ${error.message}`);
  }
}

module.exports = {
  parseJobURL
};
