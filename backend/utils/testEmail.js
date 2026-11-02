require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const nodemailer = require('nodemailer');
const { sendComplaintNotification } = require('./emailService');

async function testEmail() {
  console.log('--- Testing TMS Email Notification ---');
  console.log('NOTIFICATION_EMAIL:', process.env.NOTIFICATION_EMAIL || 'ramachandranboominathan@gmail.com');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || '(Not configured)');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '******** (configured)' : '(Not configured)');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('\n❌ EMAIL_USER or EMAIL_PASS is missing in backend/.env.');
    console.log('Please set:');
    console.log('  EMAIL_USER=your_gmail@gmail.com');
    console.log('  EMAIL_PASS=your_16_character_app_password');
    process.exit(1);
  }

  const mockComplaint = {
    _id: 'TEST-' + Date.now(),
    blockName: 'Main Science Block',
    roomNumber: 'Lab 101',
    departmentName: 'Computer Science',
    programmeName: 'B.Tech IT',
    complaintType: 'PC Hardware',
    remarks: 'This is a test notification from TMS to verify email delivery.',
    status: 'Pending',
    createdAt: new Date(),
  };

  const mockCreator = {
    username: 'Ramachandran (Admin)',
    email: 'ramachandranboominathan@gmail.com',
    phone: '9876543210',
  };

  console.log('\nSending test complaint notification...');
  const result = await sendComplaintNotification(mockComplaint, mockCreator);
  console.log('Result:', result);
}

testEmail();

