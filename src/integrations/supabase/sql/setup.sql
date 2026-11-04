-- Create invite_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS invite_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read invite codes (needed for validation during login/signup)
CREATE POLICY "Allow public read access to invite codes" 
  ON invite_codes 
  FOR SELECT 
  TO public 
  USING (true);

-- Insert a default invite code for testing
INSERT INTO invite_codes (code) 
VALUES ('0460')
ON CONFLICT (code) DO NOTHING;