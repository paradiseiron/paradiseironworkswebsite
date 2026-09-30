This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Lead notification email

Website quote requests are saved even if notification delivery fails. Configure
these deployment environment variables to send the internal notification:

```text
RESEND_API_KEY=re_...
LEAD_NOTIFICATION_FROM_EMAIL=Paradise Ironworks Website <website@paradiseironworks.com>
LEAD_NOTIFICATION_TO_EMAIL=info@paradiseironworks.com
NEXT_PUBLIC_SITE_URL=https://www.paradiseironworks.com
```

The sender domain must be verified with Resend. Apply the Supabase migration in
`supabase/migrations` before deploying the unread-lead interface.

## Cost document extraction

The Costing inbox analyzes uploaded PDFs and images with the OpenAI Responses
API, then presents the extracted values for human review. Configure these
server-side deployment variables:

```text
OPENAI_API_KEY=sk-...
OPENAI_COST_EXTRACTION_MODEL=gpt-4.1-mini
```

`OPENAI_COST_EXTRACTION_MODEL` is optional and defaults to `gpt-4.1-mini`.
Apply the costing migrations before enabling uploads. Never expose the API key
through a `NEXT_PUBLIC_` environment variable.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# paradiseironworkswebsite
