# Supabase Database Setup Guide

## 📋 Progress Summary

- ✅ **Step 1:** Get Supabase Credentials - COMPLETED
- ✅ **Step 2:** Deploy Database Schema - COMPLETED
- ✅ **Step 3:** Configure Row Level Security (RLS) - COMPLETED
- ✅ **Step 4:** Enable Realtime - COMPLETED
- ✅ **Step 5:** Authentication Setup - COMPLETED
- ✅ **Step 6:** Verify Setup - **COMPLETED**

---

## Prerequisites

(

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Have your `.env` file ready in `apps/api/`

## Step 1: Get Supabase Credentials

### Database Connection

1. Go to **Settings → Database**
2. Copy connection strings:
   - **Transaction mode** → `DATABASE_URL`
   - **Session mode** → `DIRECT_URL`

### API Keys

1. Go to **Settings → API**
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### Update Environment Variables

Update your `apps/api/.env`:

```env
# Database (from Supabase Settings → Database)
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Supabase (from Settings → API)
SUPABASE_URL="https://[project-ref].supabase.co"
SUPABASE_ANON_KEY="[anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[service-role-key]"

# JWT (use a strong secret)
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="43200s"

# Server
PORT=3001
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:3000,http://localhost:8081"

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
```

)// done already

## Step 2: Deploy Database Schema ✅ COMPLETED

```bash
# Navigate to API directory
cd apps/api

# Generate Prisma client
pnpm db:generate  # ✅ DONE

# Push schema to Supabase
pnpm db:push      # ✅ DONE

# Run seed data
pnpm db:seed      # ✅ DONE
```

**Status:** Schema deployed successfully, 4 bot personalities and global chat room created.

## Step 3: Configure Row Level Security (RLS) 🔄 NEXT

**Action Required:**

1. Go to **SQL Editor** in Supabase Dashboard
2. Run the contents of `apps/api/prisma/rls-policies.sql`

Or copy and paste this:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_personalities ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own data
CREATE POLICY "Users can manage own data" ON users
  FOR ALL USING (auth.uid()::text = id);

CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL USING (auth.uid()::text = user_id);

-- Chat participants can read chats they're part of
CREATE POLICY "Participants can read chats" ON chats
  FOR SELECT USING (
    id IN (
      SELECT chat_id FROM chat_participants
      WHERE user_id = auth.uid()::text
    ) OR type = 'GLOBAL'
  );

-- Users can create new chats
CREATE POLICY "Users can create chats" ON chats
  FOR INSERT WITH CHECK (true);

-- Users can read chat participants for chats they're in
CREATE POLICY "Read chat participants" ON chat_participants
  FOR SELECT USING (
    chat_id IN (
      SELECT chat_id FROM chat_participants
      WHERE user_id = auth.uid()::text
    )
  );

-- Users can join chats
CREATE POLICY "Users can join chats" ON chat_participants
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Users can read messages from chats they're part of
CREATE POLICY "Read messages from joined chats" ON messages
  FOR SELECT USING (
    chat_id IN (
      SELECT chat_id FROM chat_participants
      WHERE user_id = auth.uid()::text
    ) OR chat_id IN (
      SELECT id FROM chats WHERE type = 'GLOBAL'
    )
  );

-- Users can send messages to chats they're part of
CREATE POLICY "Send messages to joined chats" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()::text AND
    (chat_id IN (
      SELECT chat_id FROM chat_participants
      WHERE user_id = auth.uid()::text
    ) OR chat_id IN (
      SELECT id FROM chats WHERE type = 'GLOBAL'
    ))
  );

-- Everyone can read bot personalities
CREATE POLICY "Read active bot personalities" ON bot_personalities
  FOR SELECT USING (is_active = true);

-- Create function to automatically add user profile on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

# ✅ DONE

## Step 4: Enable Realtime ⏳ PENDING

**Action Required:**

1. Go to **Database → Replication**
2. Enable realtime for these tables:
   - `messages`
   - `chats`
   - `chat_participants`

# ✅ DONE

## Step 5: Authentication Setup ⏳ PENDING

**Action Required:**

1. Go to **Authentication → Settings**
2. Configure **Site URL**: `http://localhost:3000` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (Web)
   - `http://localhost:8081/auth/callback` (Expo dev server)
   - `chatmate://auth/callback` (Mobile deep link)
   - Your production URLs when deploying
4. Enable **Email Auth** if not already enabled
5. Configure **Email Templates** (optional)
6. Set **JWT expiry** (default: 1 hour is fine for development)

**Note:** The `chatmate://` scheme is configured in `apps/app/app.json` for cross-platform deep linking. # ✅ DONE

## Step 6: Verify Setup ✅ COMPLETED

**Verification Results:**

### ✅ 1. Database Verification

- **Prisma Studio:** Running successfully on http://localhost:5555
- **Seed Data:** 4 bot personalities and 1 global chat room confirmed
- **Schema:** All tables deployed with proper structure

### ✅ 2. API Server Test

- **NestJS API:** Running successfully on http://localhost:3001
- **Routes:** All endpoints mapped correctly
  - `GET /` - Root endpoint
  - `GET /api/v1/users/profile` - User profile
  - `POST /api/v1/users/profile` - Update profile
  - `GET /api/v1/users/:id` - Get user by ID
- **Security:** Helmet, CORS, and compression middleware active
- **Database Connection:** Prisma connected to Supabase successfully

### ✅ 3. Environment Configuration

- **Database URLs:** Configured for Supabase connection
- **JWT:** Secret and expiration set
- **CORS:** Configured for localhost:3000 and localhost:8081
- **Rate Limiting:** Configured (60s TTL, 100 requests limit)

### ✅ 4. Authentication Setup

- **Supabase Auth:** Configured with proper redirect URLs
- **Deep Linking:** `chatmate://` scheme configured in app.json
- **JWT Verification:** Ready for Supabase token validation

### 🎯 Ready for Development

All Supabase infrastructure is now configured and verified. You can proceed with:

- Building chat features
- Implementing bot personalities
- Adding real-time messaging
- Creating authentication UI

## Troubleshooting

### Connection Issues

- Ensure your IP is whitelisted in Supabase (Settings → Database → Network Restrictions)
- Check that DATABASE_URL and DIRECT_URL are correct

### RLS Issues

- Make sure all policies are created successfully
- Test with a real user account, not service role

### Realtime Issues

- Verify tables are enabled for realtime
- Check that RLS policies allow the operations you need

## 🚀 Next Development Phase

**🎉 Setup Complete!** All Supabase infrastructure is configured and verified.

**Current Status:**

- ✅ Database schema deployed with seed data
- ✅ RLS policies configured and active
- ✅ Realtime enabled for chat tables
- ✅ Authentication configured with deep linking
- ✅ API server running and verified
- ✅ Prisma Studio accessible for data management

**Ready to Build:**

1. **Chat Features** - Real-time messaging with Supabase Realtime
2. **Bot Personalities** - 4 AI bots ready for integration
3. **Authentication UI** - Login/signup flows with Supabase Auth
4. **Global Chat Room** - Sandbox environment for users
5. **Message Features** - Summarization and translation
6. **Recruiter Mode** - Professional showcase features

**Development Servers Running:**

- 🔧 **API:** http://localhost:3001
- 🗄️ **Database Studio:** http://localhost:5555

## Final Verification Steps

1. Test authentication flow
2. Test chat creation and messaging
3. Verify bot personalities are loaded
4. Test realtime updates
