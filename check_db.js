const dbModule = require('./src/db/init');

async function checkDatabase() {
  try {
    const db = await dbModule.getDb();

    console.log('=== CHECKING JOBS IN DATABASE ===\n');

    const jobs = await db.all('SELECT id, job_title, company, job_code, hr_email FROM jobs ORDER BY created_at DESC');
    console.log(`Found ${jobs.length} jobs:\n`);

    jobs.forEach((job, index) => {
      console.log(`${index + 1}. ID: ${job.id}`);
      console.log(`   Title: ${job.job_title}`);
      console.log(`   Company: ${job.company}`);
      console.log(`   Job Code: ${job.job_code || 'NULL'}`);
      console.log(`   HR Email: ${job.hr_email}`);
      console.log('');
    });

    console.log('\n=== EMAIL DISTRIBUTION ===\n');
    const emails = await db.all('SELECT DISTINCT hr_email FROM jobs');
    console.log('Emails in database:');
    emails.forEach(row => {
      console.log(`- ${row.hr_email}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
