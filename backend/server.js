require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const programmeRoutes = require('./routes/programmeRoutes');
const blockRoutes = require('./routes/blockRoutes');
const roomRoutes = require('./routes/roomRoutes');
const roleRoutes = require('./routes/roleRoutes');
const userRoutes = require('./routes/userRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/programmes', programmeRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Complaints
app.use('/api/complaints', complaintRoutes);

// Health check & diagnostics
app.get('/api/health', (req, res) => {
  res.json({
    message: 'Server is running',
    version: '1.2.0-email-live',
    emailConfigured: Boolean(process.env.EMAIL_PASS),
    notificationTarget: process.env.NOTIFICATION_EMAIL || 'ramachandranboominathan@gmail.com',
  });
});

// Direct test email endpoint to verify live server email capabilities
app.get('/api/test-email', async (req, res) => {
  const { sendComplaintNotification } = require('./utils/emailService');
  const mockComplaint = {
    _id: 'LIVE-TEST-' + Date.now(),
    blockName: 'Diagnostic Block',
    roomNumber: '101',
    departmentName: 'IT System',
    programmeName: 'Live Diagnostics',
    complaintType: 'Server Email Test',
    remarks: 'This test verifies that the live server can successfully dispatch email notifications.',
    status: 'Pending',
    createdAt: new Date(),
  };
  const mockCreator = {
    username: 'Render Diagnostics',
    email: 'ramachandranboominathan@gmail.com',
    phone: 'Verified',
  };

  try {
    const result = await sendComplaintNotification(mockComplaint, mockCreator);
    if (result && result.success) {
      return res.json({
        success: true,
        message: 'Test email successfully sent to ' + (process.env.NOTIFICATION_EMAIL || 'ramachandranboominathan@gmail.com'),
        messageId: result.messageId,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Email could not be sent',
        reason: result?.reason || result?.error || 'Unknown error',
        tip: 'Ensure EMAIL_PASS is added in Render Dashboard -> Environment Variables',
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
