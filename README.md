# BharatAI — secure API setup

`India.html` no longer stores or reads an API key from `localStorage`. The browser sends chat requests only to `/api/chat`.

## Files

- `India.html` — frontend
- `api/chat.js` — secure server-side proxy; reads `process.env.AI_API`
- `vercel.json` — Vercel function configuration

## Important

GitHub Repository Secrets are **not available directly to browser JavaScript**. If the site is deployed as GitHub Pages, `/api/chat` will not run there. Deploy this same repository to a serverless host such as Vercel, and put `AI_API` in that host's Environment Variables.

If you specifically want GitHub Actions to remain the source of the secret, the workflow can pass the GitHub `AI_API` secret to the hosting platform during deployment. The secret must still exist server-side at runtime; it must never be written into `India.html`.

## Vercel environment variable

Create an environment variable:

`AI_API` = your OpenRouter API key

Optional:

`APP_URL` = your deployed site URL

## LocalStorage

The frontend may still use `localStorage` for conversations, model/language/preferences, but it no longer stores `api_key` or `api_endpoint`.
