This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The root route
(`src/app/(dashboard)/page.tsx`) redirects to the sign-in page, the workspace creation page, or your
first workspace, depending on the current session.

You can start editing the pages under `src/app`; they auto-update as you edit the files.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to
automatically optimize and load [Inter](https://fonts.google.com/specimen/Inter).

## Appwrite setup & demo data

This app is backed by [Appwrite](https://appwrite.io). Copy the environment template and fill in your
project's values, then provision the backend:

```bash
cp .env.example .env.local

# Create the database, tables (collections), columns (attributes), indexes and storage bucket.
bun scripts/setup-appwrite.mjs

# Seed a demo account with a workspace, members, projects and tasks.
bun scripts/seed-demo.mjs
bun scripts/seed-demo.mjs --reset   # remove the seeded data first, then recreate it
```

Both scripts read their credentials from `.env.local` and are safe to re-run. `setup-appwrite` skips
resources that already exist, and `seed-demo` only ever touches records whose id starts with `demo-`.

The API key needs the Databases (tables, rows, columns, indexes) and Storage (buckets, files) scopes,
plus `users.write` for the seeding script.

### Demo account

| Email | Role | Password |
| --- | --- | --- |
| `demo@taskmanager.dev` | ADMIN | `demo1234` |
| `alex@taskmanager.dev` | MEMBER | `demo1234` |
| `sam@taskmanager.dev` | MEMBER | `demo1234` |
| `jordan@taskmanager.dev` | MEMBER | `demo1234` |

Signing in as `demo@taskmanager.dev` opens the "Acme Product Team" workspace, which contains 3
projects and 14 tasks spread across every status.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
