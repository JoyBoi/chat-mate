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