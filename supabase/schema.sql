-- Create the lightbulb table
CREATE TABLE lightbulb (
  id SERIAL PRIMARY KEY,
  is_on BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the initial record
INSERT INTO lightbulb (id, is_on) VALUES (1, false);

-- Create a function to update the timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function
CREATE TRIGGER update_lightbulb_timestamp
BEFORE UPDATE ON lightbulb
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Enable Row Level Security (RLS)
ALTER TABLE lightbulb ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read the lightbulb state
CREATE POLICY "Anyone can read lightbulb state" ON lightbulb
  FOR SELECT USING (true);

-- Create a policy that allows anyone to update the lightbulb state
CREATE POLICY "Anyone can update lightbulb state" ON lightbulb
  FOR UPDATE USING (true);

-- Note: In a production environment, you might want to restrict these policies
-- to authenticated users only, but for this demo we're allowing anonymous access. 