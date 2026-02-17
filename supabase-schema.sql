-- ============================================
-- TradeZen Database Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- ==========================================
-- 1. PROFILES TABLE
-- Stores user profile data linked to auth
-- ==========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TABLE public.profiles IS 'User profiles linked to Supabase Auth';

-- ==========================================
-- 2. CHAT HISTORY TABLE
-- Stores AI mentor conversations
-- ==========================================
CREATE TABLE public.chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fetching user's chat history chronologically
CREATE INDEX idx_chat_history_user_created ON public.chat_history(user_id, created_at ASC);

COMMENT ON TABLE public.chat_history IS 'AI mentor chat messages per user';

-- ==========================================
-- 3. PORTFOLIO TABLE
-- Stores crypto holdings for each user
-- ==========================================
CREATE TABLE public.portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coin_symbol TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL CHECK (amount > 0),
  buy_price DOUBLE PRECISION NOT NULL CHECK (buy_price >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fetching user's portfolio
CREATE INDEX idx_portfolio_user ON public.portfolio(user_id);

-- Auto-update updated_at
CREATE TRIGGER on_portfolio_updated
  BEFORE UPDATE ON public.portfolio
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.portfolio IS 'User crypto holdings with buy price tracking';

-- ==========================================
-- 4. ALERTS TABLE
-- Stores price alert configurations
-- ==========================================
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coin_symbol TEXT NOT NULL,
  target_price DOUBLE PRECISION NOT NULL CHECK (target_price > 0),
  direction TEXT NOT NULL CHECK (direction IN ('above', 'below')),
  is_triggered BOOLEAN DEFAULT FALSE NOT NULL,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fetching user's active alerts
CREATE INDEX idx_alerts_user_active ON public.alerts(user_id, is_triggered);

-- Auto-set triggered_at when alert fires
CREATE OR REPLACE FUNCTION public.handle_alert_triggered()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_triggered = TRUE AND OLD.is_triggered = FALSE THEN
    NEW.triggered_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_alert_triggered
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_alert_triggered();

COMMENT ON TABLE public.alerts IS 'User price alerts with trigger tracking';

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS)
-- Users can only access their own data
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read/update only their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow the trigger to insert profiles (SECURITY DEFINER handles this)
CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- CHAT HISTORY: Users can CRUD only their own messages
CREATE POLICY "Users can view own chat history"
  ON public.chat_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat history"
  ON public.chat_history FOR DELETE
  USING (auth.uid() = user_id);

-- PORTFOLIO: Users can CRUD only their own holdings
CREATE POLICY "Users can view own portfolio"
  ON public.portfolio FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add own holdings"
  ON public.portfolio FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own holdings"
  ON public.portfolio FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own holdings"
  ON public.portfolio FOR DELETE
  USING (auth.uid() = user_id);

-- ALERTS: Users can CRUD only their own alerts
CREATE POLICY "Users can view own alerts"
  ON public.alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON public.alerts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON public.alerts FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- 6. ENABLE REALTIME
-- For live portfolio & alert updates
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
