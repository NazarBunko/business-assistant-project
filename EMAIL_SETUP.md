# Email Configuration Guide

## Overview

The system uses Nodemailer to send support requests from users to the administrator via email. When a user submits a support request from their profile, an email is sent containing:

- User's full name
- User's email
- User's phone number
- Company name
- Job title
- The support message

## Configuration

### 1. Environment Variables

Add the following variables to `apps/api/.env`:

```env
# Email Configuration
ADMIN_EMAIL="admin@example.com"          # Where support requests will be sent
SMTP_HOST="smtp.gmail.com"               # SMTP server hostname
SMTP_PORT=587                            # SMTP port (587 for TLS, 465 for SSL)
SMTP_USER="your-email@gmail.com"         # Email account to send from
SMTP_PASS="your-app-password"            # Email password or app password
```

### 2. Gmail Setup (Recommended)

If using Gmail, you need to create an **App Password** (not your regular Gmail password):

#### Steps:

1. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com/security
   - Under "Signing in to Google", enable "2-Step Verification"

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Business Assistant"
   - Copy the 16-character password
   - Use this as your `SMTP_PASS`

3. **Configure .env**
   ```env
   ADMIN_EMAIL="your-admin-email@gmail.com"
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-sending-email@gmail.com"
   SMTP_PASS="xxxx xxxx xxxx xxxx"  # 16-char app password
   ```

### 3. Other Email Providers

#### Outlook/Hotmail
```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT=587
SMTP_USER="your-email@outlook.com"
SMTP_PASS="your-password"
```

#### Yahoo
```env
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT=587
SMTP_USER="your-email@yahoo.com"
SMTP_PASS="your-app-password"
```

#### Custom SMTP Server
```env
SMTP_HOST="mail.yourdomain.com"
SMTP_PORT=587
SMTP_USER="noreply@yourdomain.com"
SMTP_PASS="your-password"
```

## Testing

### 1. Install Dependencies

Run this from the project root:

```bash
pnpm install
```

This will install nodemailer and @types/nodemailer.

### 2. Start the API Server

```bash
pnpm dev
```

### 3. Test Support Request

1. Log in to the application
2. Go to Profile page
3. Click "Contact Administrator" button
4. Write a test message
5. Click "Send"
6. Check your admin email inbox

## Email Template

The email sent to the administrator includes:

- **Subject**: "Звернення від {User Name} ({Company Name})"
- **Content**:
  - User's full name
  - Email address
  - Phone number
  - Company name
  - Job title
  - Support message

## Troubleshooting

### Error: "Failed to send support request"

**Possible causes:**

1. **SMTP credentials not configured**
   - Check that all SMTP_* variables are set in .env
   - Verify ADMIN_EMAIL is configured

2. **Invalid credentials**
   - For Gmail, ensure you're using App Password, not regular password
   - Verify SMTP_USER matches the email account

3. **Port blocked**
   - Try port 465 (SSL) instead of 587 (TLS)
   - Check firewall settings

4. **Gmail "Less secure app access"**
   - Gmail deprecated this - use App Password instead
   - Ensure 2FA is enabled

### Check Server Logs

If email fails to send, check the API console output:

```
Failed to send support email: [Error details]
```

### Test SMTP Connection

You can test your SMTP credentials using a simple script:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password',
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('SMTP connection successful!');
  }
});
```

## Security Notes

1. **Never commit .env files** - They contain sensitive credentials
2. **Use App Passwords** - Don't use your main email password
3. **Rotate credentials regularly** - Change passwords periodically
4. **Monitor email usage** - Watch for suspicious activity
5. **Use dedicated email** - Consider using a separate email for system notifications

## Production Considerations

For production environments:

1. **Use dedicated SMTP service** (SendGrid, Mailgun, AWS SES)
2. **Implement rate limiting** to prevent spam
3. **Add email queue** (Bull, Bee-Queue) for better reliability
4. **Monitor delivery rates** and failures
5. **Set up SPF/DKIM/DMARC** for better deliverability
6. **Use environment-specific admin emails** (dev vs production)

## Example Production Setup with SendGrid

```env
ADMIN_EMAIL="support@yourcompany.com"
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
```
