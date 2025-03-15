# Global Lightbulb Setup Guide

This guide will help you set up the Global Lightbulb application step by step.

## 1. Supabase Setup

### Create a Supabase Account and Project
1. Go to [https://supabase.com](https://supabase.com) and sign up for an account if you don't have one
2. Create a new project
3. Wait for your database to be ready

### Set Up the Database
1. In your Supabase project, go to the SQL Editor
2. Copy the contents of the `supabase/schema.sql` file from this project
3. Paste it into the SQL Editor and click "Run"
4. This will create the lightbulb table and set up the necessary permissions

### Enable Realtime
1. Go to Database > Replication in the Supabase dashboard
2. Find the "lightbulb" table in the list
3. Enable realtime for this table by toggling the switch to "ON"

### Get Your API Credentials
1. Go to Project Settings > API in the Supabase dashboard
2. Copy the "Project URL" and "anon/public" key

## 2. Application Setup

### Configure Environment Variables
1. Open the `.env.local` file in the root of this project
2. Replace `your_supabase_url_here` with your Project URL
3. Replace `your_supabase_anon_key_here` with your anon/public key
4. Save the file

### Start the Application
1. Make sure you have Node.js installed (v18 or newer)
2. Open a terminal in the project root
3. Run `npm install` to install dependencies
4. Run `npm run dev` to start the development server
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Troubleshooting

If you see a connection error:
1. Check that your Supabase URL and anon key are correct in `.env.local`
2. Verify that you've run the SQL script to create the lightbulb table
3. Make sure realtime is enabled for the lightbulb table
4. Check your browser console for specific error messages

## Next Steps

Once the basic application is working, you can:
1. Deploy it to Vercel or another hosting service
2. Implement Discord authentication (coming soon)
3. Add more features like user statistics or toggle history 