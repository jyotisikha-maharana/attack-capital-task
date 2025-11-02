# Attack Capital Unified Inbox

A production-ready, full-stack unified inbox application that aggregates messages from SMS (Twilio), WhatsApp (Twilio API), Email, and Social Media (Twitter/X, Facebook Messenger) into a single, contact-threaded interface.

## 🎯 Key Features

- **Multi-Channel Communication**: Unified inbox for SMS, WhatsApp, Email, Twitter DMs, and Facebook Messenger
- **Real-Time Collaboration**: Team notes with @mentions and presence indicators
- **Message Scheduling**: Schedule messages with cron-like templates
- **Analytics Dashboard**: Track engagement metrics, response times, and conversion funnels
- **Contact Management**: Auto-merge duplicate contacts with fuzzy matching
- **Role-Based Access Control**: Team-based permissions (Admin, Agent, Viewer)
- **Twilio Number Management**: Purchase and manage Twilio phone numbers

## 🏗️ Architecture

### Tech Stack

- **Frontend/Backend**: Next.js 14+ (App Router, TypeScript)
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: Better Auth (credentials + Google OAuth)
- **Integrations**:
  - Twilio SDK (SMS/WhatsApp)
  - Resend (Email)
  - Twitter API v2 (DMs)
  - Facebook Graph API (Messenger)
- **UI**: Tailwind CSS, React Query for data fetching
- **Validation**: Zod for API validation

### Database Schema

```mermaid
erDiagram
    User ||--o{ TeamMember : "belongs to"
    Team ||--o{ TeamMember : "has"
    Team ||--o{ Contact : "has"
    Contact ||--o{ Message : "has"
    Contact ||--o{ NoteThread : "has"
    Contact ||--o{ ScheduledMessage : "has"
    Message ||--o{ MessageEvent : "tracks"
    User ||--o{ Message : "sends"
    User ||--o{ NoteThread : "creates"
    User ||--o{ ScheduledMessage : "creates"
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Twilio account with SMS/WhatsApp enabled
- (Optional) Google OAuth credentials
- (Optional) Resend API key for email
- (Optional) Twitter API credentials
- (Optional) Facebook App credentials

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd attack-capital-unified-inbox
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/unified_inbox"
TWILIO_ACCOUNT_SID="your_account_sid"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"

BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

RESEND_API_KEY="your_resend_key"  # Optional
TWITTER_ACCESS_TOKEN="your_twitter_token"  # Optional
FACEBOOK_PAGE_ACCESS_TOKEN="your_facebook_token"  # Optional
```

4. **Set up the database**
```bash
npm run db:generate
npm run db:migrate
```

5. **Run the development server**
```bash
npm run dev
```

6. **Configure Twilio Webhook**
   - Go to your Twilio Console
   - Configure webhook URL: `https://yourdomain.com/api/webhooks/twilio`
   - Set it for both SMS and WhatsApp incoming messages

## 📖 API Documentation

### Authentication

- `POST /api/auth/sign-in/email` - Sign in with email/password
- `GET /api/auth/sign-in/social/google` - Sign in with Google OAuth

### Messages

- `GET /api/messages?contactId=<id>` - Get messages for a contact
- `POST /api/messages/send` - Send a message
- `POST /api/messages/[id]/read` - Mark message as read
- `GET /api/messages/unread-count` - Get unread message count

### Contacts

- `GET /api/contacts` - List contacts (threaded with last message)
- `GET /api/contacts/[id]` - Get contact details

### Notes

- `GET /api/notes?contactId=<id>` - Get notes for a contact
- `POST /api/notes` - Create a note

### Analytics

- `GET /api/analytics?days=30` - Get analytics data

### Twilio Numbers

- `GET /api/twilio/numbers` - List Twilio numbers
- `POST /api/twilio/numbers` - Purchase a new number

## 🔧 Integration Comparison

| Channel | Latency | Cost (approximate) | Reliability | Status |
|---------|---------|-------------------|-------------|--------|
| SMS (Twilio) | < 5s | $0.0075/msg | 99.9% | ✅ Production Ready |
| WhatsApp (Twilio) | < 10s | $0.005/msg | 99.5% | ✅ Production Ready |
| Email (Resend) | < 30s | $0.10/1000 | 99% | ✅ Production Ready |
| Twitter DMs | < 15s | Free (rate limited) | 95% | 🟡 Requires OAuth |
| Facebook Messenger | < 10s | Free | 98% | 🟡 Requires Webhook Setup |

## 🎨 UI Components

- **Unified Inbox**: Kanban-style view with contact threads
- **Contact Profile Modal**: History timeline, notes, and quick actions
- **Message Composer**: Multi-channel composer with scheduling
- **Analytics Dashboard**: Engagement metrics and charts

## 🔐 Security Features

- Secure webhook validation
- Role-based access control (RBAC)
- Encrypted private notes
- OAuth for social media APIs
- Environment variable secrets

## 📝 Development

### Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── analytics/        # Analytics page
│   ├── inbox/            # Main inbox page
│   └── login/            # Login page
├── components/
│   ├── analytics/        # Analytics components
│   ├── auth/             # Authentication components
│   └── inbox/            # Inbox components
├── lib/
│   ├── integrations.ts   # Integration factory
│   ├── contact-merge.ts  # Duplicate detection
│   ├── auth.ts           # Better Auth config
│   └── utils/            # Utility functions
└── prisma/
    └── schema.prisma     # Database schema
```

### Key Decisions

1. **Integration Factory Pattern**: Centralized channel management via `/lib/integrations.ts`
2. **Normalized Message Schema**: Single `Message` table stores all channels
3. **Contact Threading**: Messages grouped by contact, not channel
4. **React Query**: Optimistic updates and caching for better UX
5. **Better Auth**: Modern auth solution with built-in RBAC support

## 🚧 Future Enhancements

- [ ] Real-time WebSocket updates (Pusher/Ably)
- [ ] HubSpot contact sync
- [ ] Slack/Zapier webhooks
- [ ] Advanced message templates
- [ ] VoIP calling via Twilio Client SDK
- [ ] Exportable reports (PDF/CSV)
- [ ] Mobile app (React Native)

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📧 Support

For questions or support, please open an issue in the repository.
