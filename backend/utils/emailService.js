const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

/**
 * Creates and returns the nodemailer transporter using environment variables.
 */
function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  // If custom SMTP is provided
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user,
        pass,
      },
    });
  }

  // Default to Gmail service
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Sends an email notification when a new complaint is created.
 *
 * @param {Object} complaint - The saved complaint document
 * @param {Object} creator - The user who created the complaint (optional)
 */
async function sendComplaintNotification(complaint, creator = null) {
  const recipient =
    process.env.NOTIFICATION_EMAIL || 'ramachandranboominathan@gmail.com';

  const transporter = getTransporter();
  if (!transporter) {
    console.warn(
      `\n⚠️  [Email Notification] EMAIL_USER or EMAIL_PASS is not configured in .env.\n` +
      `   Notification to <${recipient}> was skipped.\n` +
      `   To enable real email alerts, add your Gmail address and 16-character App Password to backend/.env:\n` +
      `   EMAIL_USER=your_email@gmail.com\n` +
      `   EMAIL_PASS=your_16_character_app_password\n`
    );
    return { success: false, reason: 'Credentials not configured' };
  }

  const creatorName = creator?.username || 'Not Specified';
  const creatorEmail = creator?.email || 'Not Specified';
  const creatorPhone = creator?.phone || 'Not Specified';

  const formattedDate = complaint.createdAt
    ? new Date(complaint.createdAt).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'medium',
      })
    : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const subject = `🚨 [TMS Alert] New Complaint Raised: ${complaint.complaintType} - ${complaint.blockName} (${complaint.roomNumber})`;

  const textContent = `
New Complaint Notification - TMS (Complaint Management System)
==============================================================

Complaint Details:
------------------
- Complaint ID: ${complaint._id}
- Complaint Type: ${complaint.complaintType}
- Department: ${complaint.departmentName || 'N/A'}
- Programme: ${complaint.programmeName || 'N/A'}
- Block: ${complaint.blockName}
- Room Number: ${complaint.roomNumber}
- Status: ${complaint.status || 'Pending'}
- Date & Time: ${formattedDate} (IST)

Remarks / Description:
----------------------
${complaint.remarks || 'No remarks provided.'}

Raised By:
----------
- Name: ${creatorName}
- Email: ${creatorEmail}
- Phone: ${creatorPhone}

Attachment: ${complaint.attachment ? 'Yes (Attached to this email)' : 'None'}
==============================================================
`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Complaint Notification</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      color: #1e293b;
      margin: 0;
      padding: 20px;
    }
    .email-container {
      max-width: 620px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      color: #ffffff;
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 6px 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .header p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .badge-container {
      display: flex;
      justify-content: center;
      margin-top: 14px;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      background-color: #fee2e2;
      color: #dc2626;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 24px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.75px;
      color: #64748b;
      margin: 20px 0 10px 0;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .info-table td {
      padding: 10px 12px;
      font-size: 14px;
      border-bottom: 1px solid #f1f5f9;
    }
    .info-table td.label {
      width: 38%;
      font-weight: 600;
      color: #475569;
      background-color: #f8fafc;
      border-radius: 4px;
    }
    .info-table td.value {
      width: 62%;
      color: #0f172a;
      font-weight: 500;
    }
    .remarks-box {
      background-color: #f8fafc;
      border-left: 4px solid #2563eb;
      padding: 14px 16px;
      border-radius: 0 8px 8px 0;
      font-size: 14px;
      line-height: 1.5;
      color: #334155;
      margin-top: 8px;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 18px 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>TMS Complaint Alert</h1>
      <p>A new complaint ticket has been submitted</p>
      <div class="badge-container">
        <span class="badge">Status: ${complaint.status || 'Pending'}</span>
      </div>
    </div>

    <div class="content">
      <div class="section-title">Ticket Information</div>
      <table class="info-table">
        <tr>
          <td class="label">Complaint Type</td>
          <td class="value"><strong>${complaint.complaintType}</strong></td>
        </tr>
        <tr>
          <td class="label">Location</td>
          <td class="value">${complaint.blockName} - Room ${complaint.roomNumber}</td>
        </tr>
        <tr>
          <td class="label">Department</td>
          <td class="value">${complaint.departmentName || 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">Programme</td>
          <td class="value">${complaint.programmeName || 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">Ticket ID</td>
          <td class="value" style="font-family: monospace; font-size: 13px;">${complaint._id}</td>
        </tr>
        <tr>
          <td class="label">Reported At</td>
          <td class="value">${formattedDate} (IST)</td>
        </tr>
      </table>

      <div class="section-title">Issue Description / Remarks</div>
      <div class="remarks-box">
        ${(complaint.remarks || 'No remarks provided.').replace(/\n/g, '<br/>')}
      </div>

      <div class="section-title">Submitted By</div>
      <table class="info-table">
        <tr>
          <td class="label">User Name</td>
          <td class="value">${creatorName}</td>
        </tr>
        <tr>
          <td class="label">Email Address</td>
          <td class="value"><a href="mailto:${creatorEmail}">${creatorEmail}</a></td>
        </tr>
        <tr>
          <td class="label">Phone</td>
          <td class="value">${creatorPhone}</td>
        </tr>
      </table>

      ${
        complaint.attachment
          ? `<div style="margin-top: 16px; padding: 12px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; color: #065f46; font-size: 13px;">
              📎 <strong>Attachment:</strong> A file was attached to this complaint ticket and included with this email.
            </div>`
          : ''
      }
    </div>

    <div class="footer">
      This is an automated notification from the TMS (Complaint Management System).<br>
      Recipient: ${recipient}
    </div>
  </div>
</body>
</html>
`;

  const mailOptions = {
    from: `"TMS Complaint Portal" <${process.env.EMAIL_USER}>`,
    to: recipient,
    subject,
    text: textContent,
    html: htmlContent,
  };

  // If there's an uploaded attachment on disk, attach it to the email
  if (complaint.attachment) {
    try {
      const relativeClean = complaint.attachment.startsWith('/')
        ? complaint.attachment.substring(1)
        : complaint.attachment;
      const filePath = path.join(__dirname, '..', relativeClean);

      if (fs.existsSync(filePath)) {
        mailOptions.attachments = [
          {
            filename: path.basename(filePath),
            path: filePath,
          },
        ];
      }
    } catch (attachErr) {
      console.warn('[Email Notification] Could not attach file to email:', attachErr.message);
    }
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Email Notification] Email sent successfully to ${recipient} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ [Email Notification Failed] Error sending email to ${recipient}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendComplaintNotification,
  getTransporter,
};

