import twilio from 'twilio';
import nodemailer from 'nodemailer';

// Twilio Client setup
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFromNumber = process.env.TWILIO_FROM_NUMBER;

const twilioClient = twilioAccountSid && twilioAuthToken
  ? twilio(twilioAccountSid, twilioAuthToken)
  : null;

// SendGrid / SMTP Transport setup
const sendgridApiKey = process.env.SENDGRID_API_KEY;
const smtpTransport = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    })
  : null;

/**
 * 1. Twilio SMS Dispatch
 * Exact required format:
 * 'Hi [Name], time to take 1 tablet of [Medicine] ([Dose]). Reply YES when taken.'
 */
export async function sendTwilioSMS({ to, patientName, medicineName, dose }) {
  const messageBody = `Hi ${patientName}, time to take 1 tablet of ${medicineName} (${dose}). Reply YES when taken.`;

  if (twilioClient && twilioFromNumber && to) {
    try {
      const result = await twilioClient.messages.create({
        body: messageBody,
        from: twilioFromNumber,
        to,
      });
      console.log(`[Twilio SMS] Successfully sent reminder to ${to} (SID: ${result.sid})`);
      return { success: true, messageId: result.sid, provider: 'twilio' };
    } catch (error) {
      console.error(`[Twilio SMS] Failed to send SMS to ${to}:`, error.message);
      return { success: false, error: error.message, provider: 'twilio' };
    }
  }

  // Graceful development / sandbox logging when Twilio credentials are not configured
  console.log(`[Twilio SMS Mock] Would dispatch to ${to || 'Unknown phone'}: "${messageBody}"`);
  return { success: true, messageId: `mock_twilio_${Date.now()}`, provider: 'twilio_mock' };
}

/**
 * 2. SendGrid Email Dispatch
 * Sends an HTML email reminder with a clean, responsive layout.
 */
export async function sendSendGridEmail({ to, patientName, medicineName, dose, schedule, timeBlock }) {
  const subject = `PillSync Reminder: Time for your ${timeBlock || 'scheduled'} dose of ${medicineName}`;
  const blockLabel = timeBlock ? timeBlock.charAt(0).toUpperCase() + timeBlock.slice(1) : 'Scheduled';
  const displaySchedule = schedule || 'Now';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; }
    .container { max-width: 580px; margin: 30px auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #134e4a; padding: 28px 24px; text-align: center; color: #ffffff; }
    .brand { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .brand span { color: #5eead4; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #0f172a; }
    .card { background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
    .med-name { font-size: 22px; font-weight: 700; color: #166534; margin: 0 0 6px; }
    .med-details { font-size: 15px; color: #15803d; margin: 0; }
    .slot-pill { display: inline-block; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; margin-top: 10px; }
    .action-btn { display: inline-block; background: #0d9488; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; margin: 24px 0 10px; box-shadow: 0 2px 4px rgba(13, 148, 136, 0.2); }
    .footer { background: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">pill<span>sync</span></div>
      <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px;">Smart Medication Assistant</p>
    </div>
    <div class="content">
      <div class="greeting">Hi ${patientName || 'there'},</div>
      <p style="font-size: 15px; line-height: 1.5; color: #334155; margin: 0 0 16px;">
        This is your gentle reminder to take your scheduled dose of medicine.
      </p>
      
      <div class="card">
        <div class="med-name">${medicineName}</div>
        <div class="med-details">${dose} · Scheduled for ${displaySchedule}</div>
        <div class="slot-pill">⏰ ${blockLabel} Dose</div>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/patient/home" class="action-btn">
          ✓ Mark Dose as Taken
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; text-align: center; margin: 16px 0 0;">
        If you are unable to take your dose right now, you can open your dashboard to snooze it for 15–60 minutes.
      </p>
    </div>
    <div class="footer">
      Sent with care by PillSync · Staying healthy one dose at a time.
    </div>
  </div>
</body>
</html>
`;

  // 1. Try SendGrid API if SENDGRID_API_KEY is available
  if (sendgridApiKey && to) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to, name: patientName }] }],
          from: { email: process.env.SENDGRID_FROM_EMAIL || 'reminders@pillsync.app', name: 'PillSync Reminders' },
          subject,
          content: [
            { type: 'text/plain', value: `Hi ${patientName}, time to take your dose of ${medicineName} (${dose}).` },
            { type: 'text/html', value: htmlContent },
          ],
        }),
      });

      if (response.ok || response.status === 202) {
        console.log(`[SendGrid Email] Reminder email successfully queued for ${to}`);
        return { success: true, messageId: `sendgrid_${Date.now()}`, provider: 'sendgrid' };
      } else {
        const errText = await response.text();
        console.warn(`[SendGrid Email] SendGrid API returned ${response.status}: ${errText}`);
      }
    } catch (e) {
      console.error('[SendGrid Email] Error calling SendGrid API:', e.message);
    }
  }

  // 2. Try SMTP transport as fallback
  if (smtpTransport && to) {
    try {
      const info = await smtpTransport.sendMail({
        from: process.env.SMTP_FROM || 'PillSync <notifications@pillsync.app>',
        to,
        subject,
        html: htmlContent,
        text: `Hi ${patientName}, time to take 1 tablet of ${medicineName} (${dose}). Reply YES when taken.`,
      });
      console.log(`[SMTP Email] Reminder email sent to ${to} (${info.messageId})`);
      return { success: true, messageId: info.messageId, provider: 'smtp' };
    } catch (e) {
      console.error('[SMTP Email] Error sending mail:', e.message);
    }
  }

  // 3. Fallback mock logger for local dev / testing
  console.log(`[SendGrid Email Mock] Would send HTML reminder to ${to || 'Unknown email'} for ${medicineName} (${dose})`);
  return { success: true, messageId: `mock_email_${Date.now()}`, provider: 'email_mock' };
}

/**
 * 3. Firebase Cloud Messaging (FCM) Dispatch
 * Pushes a mobile/web notification with title, body, and payload data.
 */
export async function sendFCMNotification({ token, patientName, medicineName, dose, slot, medicineId }) {
  const title = `PillSync Reminder: ${medicineName}`;
  const body = `Hi ${patientName}, it's time for your ${slot || 'scheduled'} dose of ${medicineName} (${dose}).`;

  const payload = {
    notification: { title, body },
    data: {
      medicineId: String(medicineId || ''),
      medicineName: String(medicineName || ''),
      dose: String(dose || ''),
      slot: String(slot || ''),
      click_action: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/patient/home`,
    },
  };

  // If FCM service account key / token endpoint is configured
  const fcmServerKey = process.env.FCM_SERVER_KEY;
  if (fcmServerKey && token) {
    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${fcmServerKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: token,
          notification: payload.notification,
          data: payload.data,
          priority: 'high',
        }),
      });

      const resData = await response.json();
      if (resData.success) {
        console.log(`[FCM Notification] Push delivered to device token for ${patientName}`);
        return { success: true, messageId: `fcm_${Date.now()}`, provider: 'fcm' };
      } else {
        console.warn(`[FCM Notification] FCM error response:`, resData);
      }
    } catch (error) {
      console.error(`[FCM Notification] Error dispatching FCM:`, error.message);
    }
  }

  // Fallback mock logger for local development
  console.log(`[FCM Notification Mock] Would push notification to device token: Title="${title}", Body="${body}"`);
  return { success: true, messageId: `mock_fcm_${Date.now()}`, provider: 'fcm_mock' };
}
