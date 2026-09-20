# Aura Studio

Aura Studio is a public UGC creator portfolio with a private creator CMS. The website is public, while portfolio content, media, and inquiries are managed from `/admin`.

## Live links

- **Public website:** [aura-studio-xi-black.vercel.app](https://aura-studio-xi-black.vercel.app/)
- **Private admin:** [aura-studio-xi-black.vercel.app/admin](https://aura-studio-xi-black.vercel.app/admin)
- **GitHub:** [shadianoormou/Aura_Studio](https://github.com/shadianoormou/Aura_Studio)

The admin panel uses a PIN. Published portfolio updates appear on the public website, and contact inquiries are stored in the admin inbox.

## Vercel deployment

The project is deployed as a Next.js app on Vercel. The public website and admin panel are part of the same deployment.

Required Project Environment Variables:

- `ADMIN_PIN` — private PIN for `/admin`
- `POSTGRES_URL` — Neon/Vercel Postgres connection string for portfolio items and inquiries
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob token for image and video uploads

The Vercel project should connect a Neon Postgres database and a public Vercel Blob store to the **Production** environment. After changing environment variables, create a new deployment.

Optional email notifications:

- `RESEND_API_KEY`
- `CONTACT_EMAIL`
- `CONTACT_FROM_EMAIL`

Without the optional Resend variables, inquiries are still saved in the admin inbox.

## Local development

### Requirements

- Node.js `>=22.13.0`
- npm

Install dependencies and start the local Vinext preview:

```sh
npm ci
npm run dev
```

The local preview runs on the port printed by Vinext (normally `5173`). For a production-style Vercel build, run:

```sh
npm run build:vercel
```

## Project structure

- `app/` — website pages, admin CMS, and API routes
- `lib/` — storage/database adapters and shared helpers
- `public/` — static assets
- `vercel.json` — Vercel build configuration

## Notes

- Keep secrets only in Vercel Environment Variables; never commit `.env` files or tokens.
- The website is public, but `/admin` remains PIN-protected.
- Portfolio records and inquiries are stored in Neon; uploaded media is stored in Vercel Blob.
