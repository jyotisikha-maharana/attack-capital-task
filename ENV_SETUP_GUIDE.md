# Environment Variables Setup Guide

## Quick Start - Minimum Required

For basic functionality, you only need these **3 required** variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/unified_inbox"
BETTER_AUTH_SECRET="your-random-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
TWILIO_ACCOUNT_SID="your_account_sid"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"
```

## Complete Environment Variables List

### 🔴 REQUIRED Variables

#### 1. Database Connection
```env
DATABASE_URL="postgresql://user:password@localhost:5432/unified_inbox?schema=public"
```
**How to get:**
- Local PostgreSQL: Use your local database connection string
- Docker: `postgresql://postgres:password@localhost:5432/unified_inbox`
- Cloud (Supabase/Neon): Copy from your database dashboard

#### 2. Better Auth (Authentication)
```env
BETTER_AUTH_SECRET="generate-a-random-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"
```
**How to generate secret:**
```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

#### 3. Twilio (SMS/WhatsApp)
```env
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_PHONE_NUMBER="+1234567890"
```
**How to get:**
1. Sign up at [twilio.com/try-twilio](https://twilio.com/try-twilio)
2. Go to Console Dashboard
3. Copy Account SID and Auth Token
4. Buy/Get a phone number from Twilio Console

---

### 🟡 OPTIONAL - Google OAuth

If you want Google Sign-in:
```env
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxxxx"
```

**Setup Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret

**If not set:** Google sign-in button will still show but won't work

---

### 🟡 OPTIONAL - Real-time: Pusher

If you want to use Pusher (instead of local SSE):
```env
PUSHER_APP_ID="1234567"
PUSHER_KEY="xxxxxxxxxxxxxxxxxxxx"
PUSHER_SECRET="xxxxxxxxxxxxxxxxxxxx"
PUSHER_CLUSTER="us2"

NEXT_PUBLIC_PUSHER_KEY="xxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_PUSHER_CLUSTER="us2"
```

**Setup Steps:**
1. Sign up at [pusher.com](https://pusher.com) (free tier available)
2. Create a new app
3. Copy credentials from dashboard
4. Choose cluster closest to you (us2, eu, ap-southeast-1, etc.)

**If not set:** Will automatically use local Server-Sent Events (SSE) - works perfectly on localhost!

---

### 🟡 OPTIONAL - Email Service (Resend)

If you want email sending:
```env
RESEND_API_KEY="re_xxxxxxxxxxxxx"
FROM_EMAIL="noreply@yourdomain.com"
```

**Setup Steps:**
1. Sign up at [resend.com](https://resend.com)
2. Get API key from dashboard
3. Verify your domain (or use default)

**If not set:** Email channel won't work, but SMS/WhatsApp still work

---

### 🟡 OPTIONAL - Twitter/X Integration

If you want Twitter DM support:
```env
TWITTER_ACCESS_TOKEN="your_bearer_token"
```

**Setup Steps:**
1. Go to [Twitter Developer Portal](https://developer.twitter.com)
2. Create app and get Bearer Token
3. Requires OAuth 2.0 setup

**If not set:** Twitter channel won't work

---

### 🟡 OPTIONAL - Facebook Messenger

If you want Facebook Messenger support:
```env
FACEBOOK_PAGE_ACCESS_TOKEN="your_page_access_token"
```

**Setup Steps:**
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create app
3. Get Page Access Token
4. Set up webhooks

**If not set:** Facebook channel won't work

---

### 🟡 OPTIONAL - Cron Job Secret

For scheduled message processing:
```env
CRON_SECRET="random-secret-for-cron-authentication"
```

**If not set:** Scheduled messages will still be created but won't auto-process (need manual trigger)

---

## Example `.env` Files

### Minimum Setup (Development)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/unified_inbox"
BETTER_AUTH_SECRET="my-super-secret-key-change-in-production-12345"
BETTER_AUTH_URL="http://localhost:3000"
TWILIO_ACCOUNT_SID="ACxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxx"
TWILIO_PHONE_NUMBER="+1234567890"
```

### Full Setup (All Features)
```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/unified_inbox"

# Auth
BETTER_AUTH_SECRET="super-secret-key-32-chars-min"
BETTER_AUTH_URL="http://localhost:3000"

# Twilio
TWILIO_ACCOUNT_SID="ACxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxx"
TWILIO_PHONE_NUMBER="+1234567890"

# Google OAuth
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxxxx"

# Real-time (Pusher - optional)
PUSHER_APP_ID="1234567"
PUSHER_KEY="xxxxxxxxxx"
PUSHER_SECRET="xxxxxxxxxx"
PUSHER_CLUSTER="us2"
NEXT_PUBLIC_PUSHER_KEY="xxxxxxxxxx"
NEXT_PUBLIC_PUSHER_CLUSTER="us2"

# Email
RESEND_API_KEY="re_xxxxxxxxxx"
FROM_EMAIL="noreply@yourdomain.com"

# Social Media (optional)
TWITTER_ACCESS_TOKEN="xxxxx"
FACEBOOK_PAGE_ACCESS_TOKEN="xxxxx"

# Cron
CRON_SECRET="cron-secret-key"
```

### Production Setup
```env
DATABASE_URL="postgresql://user:pass@prod-db-host:5432/unified_inbox"
BETTER_AUTH_SECRET="production-secret-32-characters-min"
BETTER_AUTH_URL="https://yourdomain.com"
TWILIO_ACCOUNT_SID="ACxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxx"
TWILIO_PHONE_NUMBER="+1234567890"
NODE_ENV="production"
```

---

## Verification

After setting up your `.env` file, verify everything works:

### 1. Check Configuration
Visit: `http://localhost:3000/api/auth/test`
- Shows which services are configured
- Helps debug missing variables

### 2. Test Database
```bash
npm run db:generate
npm run db:push
```

### 3. Test Server
```bash
npm run dev
```

---

## Security Notes

1. **Never commit `.env` to git** - Already in `.gitignore`
2. **Use different secrets for production**
3. **Rotate secrets periodically**
4. **Use environment variable managers** for production (Vercel, Railway, etc.)

---

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` format
- Verify PostgreSQL is running
- Check username/password

### "Better Auth not working"
- Verify `BETTER_AUTH_SECRET` is at least 32 characters
- Check `BETTER_AUTH_URL` matches your local URL

### "Twilio webhook not working"
- Verify credentials are correct
- Check phone number format (+country code)

### "Real-time not working"
- If Pusher: Check all 5 Pusher variables are set
- If SSE (local): Should work automatically, no setup needed
- Check browser console for connection errors

