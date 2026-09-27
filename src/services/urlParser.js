const axios = require('axios');
const cheerio = require('cheerio');

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
    const $ = cheerio.load(html);

    // Extract job title - typically in h1 or main heading
    let jobTitle = '';
    const h1 = $('h1').first().text().trim();
    if (h1) {
      jobTitle = h1;
    } else {
      // Fallback: try meta title
      jobTitle = $('meta[property="og:title"]').attr('content') || 'Unknown Job Title';
    }

    // Extract department - look for department info in the page
    // Common patterns: "Department:", "Phòng ban:", "Department: GDS" etc.
    let department = '';
    const pageText = $.text();

    // Check for Vietnamese department names first
    const deptPatterns = [
      /Phòng ban:\s*([A-Z0-9]+)/i,
      /Department:\s*([A-Z0-9]+)/i,
      /department[:\s]*([A-Z0-9]+)/gi,
      /\b(GDS|PEN|PRO|GS3|GIO)\b/i
    ];

    for (const pattern of deptPatterns) {
      const match = pageText.match(pattern);
      if (match) {
        department = match[1].toUpperCase();
        break;
      }
    }

    // Extract job code - pattern: XX-XXX-XXXX or similar
    let jobCode = '';
    const codePatterns = [
      /\b([A-Z0-9]{2,3}-[A-Z0-9]{3,4}-[0-9]{3,4})\b/i,  // XX-XXX-XXXX pattern
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
    // E.g., 26-HRA-4039 → department = HRA, 26-ENG-4040 → department = ENG
    let departmentFromCode = '';
    if (jobCode) {
      const codeParts = jobCode.split('-');
      if (codeParts.length >= 2) {
        departmentFromCode = codeParts[1];  // Get middle part (e.g., HRA from 26-HRA-4039)
      }
    }

    // Extract job description
    let jobDescription = '';

    // Try to find main content area
    const mainContent = $('.job-detail-content, [class*="detail"], [class*="description"], article, main');

    if (mainContent.length > 0) {
      jobDescription = mainContent.text().trim().substring(0, 2000);
    } else {
      // Fallback: get body text
      jobDescription = $('body').text().trim().substring(0, 2000);
    }

    // Clean up description (remove extra whitespace)
    jobDescription = jobDescription.replace(/\s+/g, ' ').trim();

    // Use department extracted from job code if available, otherwise use page-extracted department
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
