# Aura Studio

Aura Studio is a polished, client-ready portfolio website created for **Shadia Noor Mou**, a Bangladesh-based UGC (user-generated content) creator working across beauty, skincare, fashion, wellness, and lifestyle.

The project combines a public-facing portfolio with a private creator CMS. Visitors can explore selected work and send collaboration inquiries, while the owner can manage portfolio content, media, publishing status, and inquiries from one protected admin panel.

## Live project

| Area | Link |
| --- | --- |
| Public website | [aura-studio-xi-black.vercel.app](https://aura-studio-xi-black.vercel.app/) |
| Creator admin | [aura-studio-xi-black.vercel.app/admin](https://aura-studio-xi-black.vercel.app/admin) |
| Source repository | [github.com/shadianoormou/Aura_Studio](https://github.com/shadianoormou/Aura_Studio) |

## What the site includes

### Public portfolio

- Editorial, responsive landing page for a UGC creator
- Hero section, creator story, services, process, client feedback, FAQ, social links, and contact form
- Selected-work portfolio with category filters and media previews
- Responsive work cards with varied proportions and subtle motion
- Mobile navigation and touch-friendly layouts
- Accessible labels, skip navigation, semantic sections, and reduced-motion support

### Private creator CMS

- PIN-protected /admin route for owner-only access
- Dashboard overview with portfolio, published work, media, and inquiry counts
- Add portfolio items as drafts or publish them immediately
- Category and format controls for each portfolio item
- Cover image sources:
  - Upload from a phone or computer
  - Direct image URL
  - Google Drive file link
- Video sources:
  - Upload MP4/WebM from a device
  - Direct video URL
  - YouTube or Vimeo URL
  - Google Drive file link
  - Public Instagram post, Reel, or TV URL
- Publish/unpublish and delete controls
- Media library with upload, “Add to portfolio,” and copy-URL actions
- Inquiry inbox connected to the public contact form
- Optional email notification through Resend

## Technology

- Next.js 16 and React 19
- TypeScript
- Vercel deployment
- Vercel Postgres for portfolio records and inquiries
- Vercel Blob for uploaded images and videos
- Cloudflare-shaped route adapters for local/Sites compatibility
- CSS-based responsive design and motion system

## Project structure

`text
app/
  page.tsx                 Public website
  globals.css              Global design system and responsive styles
  admin/                   PIN gate and creator CMS
  api/content/             Portfolio content API
  api/inquiries/           Contact form and inquiry inbox API
  api/media/               Media upload and retrieval API
lib/
  vercel-cloudflare-shim.ts Vercel database/blob adapter
public/
  assets/                  Local visual assets
vercel.json                Vercel build and function configuration
`

## Environment variables

Create these in the Vercel project settings. Never commit real secrets to Git.

`env
ADMIN_PIN=choose-a-private-pin
POSTGRES_URL=your-vercel-postgres-connection-string
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
`

Optional email delivery:

`env
RESEND_API_KEY=your-resend-api-key
CONTACT_EMAIL=shadia.creates@gmail.com
CONTACT_FROM_EMAIL=Aura Studio <onboarding@resend.dev>
`

`POSTGRES_URL` is required for saved portfolio items and inquiries. `BLOB_READ_WRITE_TOKEN` is required for media uploads. Without the optional Resend variables, inquiries are still stored in the admin inbox.

## Run locally

### Requirements

- Node.js `>=22.13.0`
- npm

`bash
npm ci
npm run dev
`

The development command starts the local Vinext preview on the port printed in the terminal. To validate the Vercel build locally:

`bash
npm run build:vercel
`

Copy `.env.example` to a local environment file and use development-only values. Keep production credentials in Vercel Environment Variables.

## Deploy to Vercel

1. Import `shadianoormou/Aura_Studio` into Vercel.
2. Add the required environment variables for the **Production** environment.
3. Connect Vercel Postgres and Vercel Blob to the project.
4. Deploy from the `main` branch.
5. Open `/admin`, enter the private PIN, and publish portfolio content.

The build is configured through `vercel.json`:

`json
{
  "framework": "nextjs",
  "buildCommand": "npm run build:vercel",
  "installCommand": "npm ci"
}
`

## Owner workflow

1. Open the [creator admin](https://aura-studio-xi-black.vercel.app/admin).
2. Unlock it with the configured `ADMIN_PIN`.
3. Select **Add portfolio item**.
4. Add a title, brand, category, and format.
5. Choose the image/video source and provide the file or link.
6. Save as a draft or choose **Publish now**.
7. Published work appears on the public site automatically.
8. New contact-form submissions appear under **Inquiries**.

## Notes

- The public site is intended for prospective brand clients; the CMS is intended for the creator only.
- Uploaded media is limited to 20 MB per file and supports JPG, PNG, WebP, AVIF, MP4, and WebM.
- Google Drive files must be shared as “Anyone with the link” for public previews.
- Instagram media must be a public post, Reel, or TV link; profile and Story links are not supported.
- Do not commit `.env` files, API keys, database URLs, or storage tokens.

## Client context

This website was designed and implemented as a complete digital portfolio for a UGC content creator. The visual direction focuses on warm editorial typography, soft pink and plum tones, mobile-first browsing, and clear conversion paths for brand collaborations.
