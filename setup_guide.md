# Setup Guide: Pragya Community

Follow these steps to set up and run the Pragya Community Yoga Platform on your local machine.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase account (free tier works)

## 1. Project Setup

1.  Navigate to the project directory:
    ```bash
    cd d:\Internship\pragya-community
    ```
2.  Install dependencies:
    ```bashc
    npm install
    ```

## 2. Supabase Configuration

1.  Create a new project on [Supabase](https://supabase.com/).
2.  In your Supabase project dashboard, go to **SQL Editor** and run the contents of the `schema.sql` file provided in the repository. This will create all necessary tables and RLS policies.
3.  Go to **Storage** and create a new bucket named `posts`. Set it to **Public**.
4.  Go to **Project Settings > API** to find your `Project URL` and `Anon Key`.
5.  Create a `.env` file in the root directory (or rename `.env.example`) and fill in your credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

## 3. Running the Application

1.  Start the development server:
    ```bash
    npm run dev
    ```
2.  Open your browser and navigate to the URL provided in the terminal (usually `http://localhost:5173`).

## 4. Troubleshooting

- **Supabase Errors**: Ensure your `.env` variables are correct and the SQL schema has been applied.
- **Tailwind Styles**: If styles are not appearing, ensure `npm install` finished successfully and the dev server is running.
- **Media Uploads**: If uploads fail, check that the `posts` bucket in Supabase is created and set to public.

---
Enjoy the life of Pragya Yog School!
