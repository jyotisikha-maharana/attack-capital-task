# Real-time Functionality Setup

## Why Real-time Wasn't Initially Implemented

Real-time features weren't implemented initially because:

1. **Additional Infrastructure Required**: Real-time needs WebSocket servers (Pusher, Ably, or custom)
2. **Extra Costs**: Pusher/Ably have usage-based pricing
3. **Complexity**: Adds another layer to the architecture
4. **React Query Handles Most Cases**: Polling/refetching works for many scenarios

However, **real-time is now implemented!** 🎉

## What's Implemented

### ✅ Real-time Features

1. **Live Message Updates**
   - New messages appear instantly without refresh
   - Works for both inbound (Twilio webhooks) and outbound messages

2. **Message Read Status**
   - Real-time updates when messages are marked as read
   - Other users see read status changes instantly

3. **Presence Indicators**
   - See who's currently viewing a contact
   - Shows active users on each contact thread

4. **Auto-refresh**
   - React Query automatically invalidates queries on real-time events
   - UI updates seamlessly

### 📁 Files Added/Modified

**New Files:**
- `lib/pusher.ts` - Pusher server configuration
- `lib/realtime.ts` - Real-time event helpers
- `lib/realtime-client.ts` - Client-side Pusher config
- `app/api/pusher/auth/route.ts` - Pusher authentication endpoint
- `components/realtime/pusher-provider.tsx` - React provider for Pusher
- `components/realtime/presence-indicator.tsx` - Presence UI component

**Modified Files:**
- `app/api/messages/send/route.ts` - Triggers real-time events
- `app/api/webhooks/twilio/route.ts` - Triggers real-time events on inbound messages
- `app/api/messages/[id]/read/route.ts` - Triggers real-time read events
- `app/providers.tsx` - Added PusherProvider wrapper
- `package.json` - Added Pusher dependencies

## Setup Instructions

### 1. Install Dependencies

```bash
npm install pusher pusher-js
```

### 2. Create Pusher Account

1. Go to [pusher.com](https://pusher.com) and sign up (free tier available)
2. Create a new app
3. Note your credentials:
   - App ID
   - Key
   - Secret
   - Cluster (e.g., `us2`, `eu`, `ap-southeast-1`)

### 3. Configure Environment Variables

Add to your `.env` file:

```env
# Pusher Configuration
PUSHER_APP_ID="your_app_id"
PUSHER_KEY="your_key"
PUSHER_SECRET="your_secret"
PUSHER_CLUSTER="us2"

# Public (exposed to browser)
NEXT_PUBLIC_PUSHER_KEY="your_key"
NEXT_PUBLIC_PUSHER_CLUSTER="us2"
```

### 4. Restart Server

```bash
npm run dev
```

## How It Works

### Event Flow

1. **User sends message** → API saves to DB → Triggers `notifyContact()` → Pusher broadcasts → All connected clients receive event → React Query invalidates → UI updates

2. **Twilio webhook receives message** → API saves to DB → Triggers `notifyContact()` → Pusher broadcasts → All connected clients see new message instantly

3. **User marks message as read** → API updates DB → Triggers `notifyContact()` → Pusher broadcasts → Other users see read status update

### Channels Used

- `private-user-{userId}` - Personal channel for each user
- `private-contact-{contactId}` - Channel for each contact (all team members)
- `presence-contact-{contactId}` - Presence channel to show who's viewing

## Usage in Components

### Add Presence Indicator

```tsx
import { PresenceIndicator } from '@/components/realtime/pusence-indicator';

<PresenceIndicator contactId={contactId} />
```

### Subscribe to Custom Events

```tsx
import { useEffect } from 'react';
import { pusherClient } from '@/lib/realtime-client';

useEffect(() => {
  if (!pusherClient) return;
  
  const channel = pusherClient.subscribe(`private-contact-${contactId}`);
  
  channel.bind('note:created', (data) => {
    // Handle new note
    console.log('New note:', data);
  });
  
  return () => {
    pusherClient.unsubscribe(`private-contact-${contactId}`);
  };
}, [contactId]);
```

## Testing

1. Open two browser windows
2. Log in as different users (or same user in different windows)
3. Send a message in one window
4. See it appear instantly in the other window
5. Mark message as read in one window
6. See read status update in the other window

## Troubleshooting

### "Pusher not connected"

- Check environment variables are set
- Verify Pusher credentials are correct
- Check browser console for connection errors

### "Events not received"

- Verify channel subscriptions are correct
- Check Pusher dashboard for event activity
- Ensure authentication endpoint is working: `/api/pusher/auth`

### "Authentication failed"

- Check session is valid
- Verify Pusher auth endpoint returns correct format
- Check server logs for errors

## Alternative: Without Pusher

If you don't want to use Pusher, you can:

1. **Use Ably** - Similar to Pusher, just swap the SDKs
2. **Custom WebSocket** - Build your own with `ws` package
3. **Server-Sent Events (SSE)** - Simpler but one-way only
4. **Polling** - React Query already handles this (current fallback)

## Cost Considerations

- **Pusher Free Tier**: 200k messages/day, 100 concurrent connections
- **Pusher Paid**: Starts at $49/month for higher limits
- **Ably**: Similar pricing model

For most teams, the free tier is sufficient for development and small production deployments.

