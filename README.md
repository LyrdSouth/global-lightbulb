# Global Lightbulb App

A fun interactive website where users can toggle a lightbulb on and off, with the state being shared globally across all users. When one user changes the state, everyone sees the change in real-time!

## Features

- Interactive lightbulb that can be turned on/off with a click
- Real-time synchronization across all users
- Beautiful animations for the lightbulb state
- (Coming soon) Discord authentication

## Tech Stack

- Next.js with App Router
- TypeScript
- Tailwind CSS
- Supabase for real-time database and authentication

## Setup Instructions

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- Supabase account

### Supabase Setup

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)
2. In the SQL editor, run the following SQL to create the lightbulb table:

```sql
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
```

3. Enable realtime for the `lightbulb` table in the Supabase dashboard (Database > Replication > Tables > lightbulb > Enable realtime)

### Environment Setup

1. Clone this repository
2. Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_supabase_url` and `your_supabase_anon_key` with the values from your Supabase project settings.

### Installation and Running

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Run the development server:
```bash
npm run dev
# or
yarn dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Future Enhancements

- Discord authentication using Supabase Auth
- User-specific statistics (how many times you've toggled the light)
- History of recent toggles with timestamps
- Mobile-responsive design improvements

## License

MIT
