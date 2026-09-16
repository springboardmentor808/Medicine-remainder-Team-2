import nodemailer from 'nodemailer';
import twilio from 'twilio';

const smtpTransport = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    })
  : null;

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export async function deliverNotification(recipient, notification) {
  const channels = ['in_app'];
  let delivered = 0;
  if (smtpTransport && recipient.email) {
    try {
      await smtpTransport.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: recipient.email,
        subject: notification.title,
        text: notification.message,
      });
      channels.push('email');
      delivered += 1;
    } catch (e) {
      console.error('SMTP delivery failed:', e.message);
    }
  }
  if (twilioClient && process.env.TWILIO_FROM_NUMBER && recipient.phone) {
    try {
      await twilioClient.messages.create({ body: notification.message, from: process.env.TWILIO_FROM_NUMBER, to: recipient.phone });
      channels.push('sms');
      delivered += 1;
    } catch (e) {
      console.error('Twilio delivery failed:', e.message);
    }
  }
  notification.channels = channels;
  notification.delivery = delivered === 0 ? 'queued' : delivered >= 2 ? 'sent' : 'partial';
  await notification.save();
}

export { smtpTransport, twilioClient };
