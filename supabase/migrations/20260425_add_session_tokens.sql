-- Session tokens table for authentication
CREATE TABLE IF NOT EXISTS public.session_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  is_revoked boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS session_tokens_user_id_idx ON public.session_tokens(user_id);
CREATE INDEX IF NOT EXISTS session_tokens_token_idx ON public.session_tokens(token);
CREATE INDEX IF NOT EXISTS session_tokens_expires_at_idx ON public.session_tokens(expires_at);
