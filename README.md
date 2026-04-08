# Bamboo House Radio

A monthly ambient radio show broadcast on [Music Box Radio UK](https://musicboxradio.co.uk). Curated by Tim Green and Martyn Riley.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

### GitHub + Vercel

1. Push this repository to GitHub
2. Import the project on [Vercel](https://vercel.com/new)
3. Vercel will auto-detect Next.js and deploy

No environment variables required — the Mixcloud API is public.

## Adding New Shows

New Bamboo House episodes are automatically fetched from the Mixcloud API when the site loads. Tracklisting data for older shows (BH01–BH28) is in `data/shows.ts`.

To add tracklisting for a new show, add an entry to `data/shows.ts` following the existing format. The `mixcloudKey` follows the pattern:

```
/MusicBoxRadioUK/bamboo-house-sunday-{day}th-{month}-{year}/
```

e.g. `/MusicBoxRadioUK/bamboo-house-sunday-14th-march-2021/`

## Stack

- [Next.js 16](https://nextjs.org) (App Router)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Mixcloud Widget API](https://www.mixcloud.com/developers/widget/)
