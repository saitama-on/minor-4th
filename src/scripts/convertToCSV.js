const fs = require('fs');
const puppeteer = require('puppeteer');

// Main function to scrape data and convert to CSV
const scrapeAndConvertToCSV = async (url) => {
  try {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      headless: false, // Set to false to see the browser
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    console.log('Navigating to Google login...');
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Wait for user to manually login
    console.log('\nPlease login with your IIITNR account in the browser window.');
    console.log('The script will continue automatically after you login.');
    console.log('Waiting for login...');

    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Wait for members list to load (using the correct class from the HTML)
    await page.waitForSelector('.cXEmmc', { timeout: 60000 });
    
    console.log('Extracting member information...');
    
    // Extract members data with the correct selectors
    const members = await page.evaluate(() => {
      const memberElements = document.querySelectorAll('.cXEmmc');
      return Array.from(memberElements).map(element => {
        // Get name from the LnLepd class
        const name = element.querySelector('.LnLepd')?.textContent?.trim() || '';
        // Get email from the p480bb class
        const email = element.querySelector('.p480bb')?.textContent?.trim() || '';
        return { name, email };
      });
    });

    // Filter out any entries without email
    const validMembers = members.filter(m => m.email && m.email.includes('@iiitnr.edu.in'));
    
    console.log(`Found ${validMembers.length} members`);
    
    // Convert to CSV
    let csv = 'name,email\n';
    validMembers.forEach(member => {
      const name = member.name.replace(/,/g, '');
      const email = member.email.replace(/,/g, '');
      csv += `${name},${email}\n`;
    });
    
    // Write to file
    fs.writeFileSync('students.csv', csv);
    console.log('Successfully created students.csv');
    
    // Keep browser open for 5 seconds so user can verify
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('If you see a timeout error, the page structure might have changed or the content didn\'t load properly.');
  }
};

// Check if URL is provided as command line argument
const url = process.argv[2];
if (!url) {
  console.error('Please provide a URL as an argument');
  console.log('Usage: node convertToCSV.js <url>');
  process.exit(1);
}

// Run the script
scrapeAndConvertToCSV(url); 