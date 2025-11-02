# Setup Guide

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL database (local or cloud)
- [ ] Twilio account with trial number
- [ ] (Optional) Google OAuth credentials
- [ ] (Optional) Resend account for email
- [ ] (Optional) Twitter Developer account
- [ ] (Optional) Facebook Developer account

## Step-by-Step Setup

### 1. Database Setup

Create a PostgreSQL database:

```bash
# Using Docker
docker run --name unified-inbox-db -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=unified_inbox -p 5432:5432 -d postgres

# Or use a cloud service like Supabase
```

Update `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/unified_inbox"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Migration

```bash
npm run db:generate
npm run db:migrate
```

Or use `db:push` for development:
```bash
npm run db:push
```

### 4. Configure Twilio

1. Sign up at [twilio.com/try-twilio](https://twilio.com/try-twilio)
2. Get a trial phone number (SMS/WhatsApp enabled)
3. Set up WhatsApp Sandbox:
   - Go to Messaging > Try it out > Send a WhatsApp message
   - Follow instructions to join sandbox
4. Update `.env`:
```env
TWILIO_ACCOUNT_SID="your_account_sid"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"
```

5. Configure Webhook:
   - Go to Phone Numbers > Manage > Active numbers
   - Select your number
   - Set webhook URL: `https://yourdomain.com/api/webhooks/twilio`
   - Set HTTP method: POST
   - Save

### 5. Configure Better Auth

Generate a secret:
```bash
openssl rand -base64 32
```

Update `.env`:
```env
BETTER_AUTH_SECRET="generated-secret-here"
BETTER_AUTH_URL="http://localhost:3000"
```

### 6. (Optional) Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Update `.env`:
```env
GOOGLE_CLIENT_ID="your_client_id"
GOOGLE_CLIENT_SECRET="your_client_secret"
```

### 7. (Optional) Email Setup (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Get API key
3. Update `.env`:
```env
RESEND_API_KEY="your_api_key"
FROM_EMAIL="noreply@yourdomain.com"
```

### 8. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 9. Create First User

The app uses Better Auth. You can:
- Sign up via email/password at `/login`
- Sign in with Google (if configured)

### 10. Set Up Cron Job (for scheduled messages)

#### Option A: Vercel Cron

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/scheduled-messages",
    "schedule": "*/5 * * * *"
  }]
}
```

#### Option B: GitHub Actions

Create `.github/workflows/cron.yml`:
```yaml
name: Process Scheduled Messages
on:
  schedule:
    - cron: '*/5 * * * *'
jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger cron
        run: |
          curl -X GET https://yourdomain.com/api/cron/scheduled-messages \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Set `CRON_SECRET` in your environment variables.

## Testing the Setup

1. **Test Twilio Webhook**:
   - Send a test SMS/WhatsApp to your Twilio number
   - Check the inbox - message should appear

2. **Test Message Sending**:
   - Create a contact
   - Send a message via the composer
   - Verify it's delivered

3. **Test Analytics**:
   - Navigate to `/analytics`
   - Verify metrics are displayed

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall settings

### Twilio Webhook Not Working
- Verify webhook URL is accessible (use ngrok for local dev)
- Check Twilio console for webhook logs
- Verify webhook is set for correct message type

### Authentication Issues
- Verify `BETTER_AUTH_SECRET` is set
- Check session cookie settings
- Clear browser cookies and retry

### Scheduled Messages Not Processing
- Verify cron job is configured
- Check `CRON_SECRET` is set
- Review server logs for errors

## Production Deployment

1. **Environment Variables**: Set all required env vars in your hosting platform
2. **Database**: Use managed PostgreSQL (Supabase, Neon, etc.)
3. **Webhooks**: Update Twilio webhook URLs to production domain
4. **Cron**: Set up scheduled message processing
5. **SSL**: Ensure HTTPS is enabled (required for OAuth)
6. **Monitoring**: Set up error tracking (Sentry, etc.)

## Next Steps

- [ ] Set up real-time WebSocket connection (Pusher/Ably)
- [ ] Implement contact auto-merge UI
- [ ] Add message templates
- [ ] Set up email notifications
- [ ] Add export functionality
- [ ] Implement advanced filtering
- [ ] Add mobile app

