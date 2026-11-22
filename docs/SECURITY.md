# Security

If you find a security problem in FeedMe AI, please report it privately, not in a public issue.

Use GitHub's private reporting on this repository: the **Security** tab, then **Report a vulnerability**.
If that option is not shown, open an issue that says only that you have a security report, with no details,
and you will be contacted.

Helpful to include: what the problem is, where it is (a file, an address, or a request), how to reproduce
it, and what someone could do with it.

## What is in scope

- The web app and site at `feedmeai.victorsaly.com`.
- The two Workers in `worker/` and `workers/favorites-api/`.
- The iPhone app built from `ios/`.

Sign-in is handled by a separate service shared with other victorsaly.com apps; a problem there is still
worth reporting here.

## How secrets are kept

No API key is in the browser or in this repository. The keys for OpenAI, Spoonacular, SearchAPI and YouTube
are Cloudflare Worker secrets, set with `wrangler secret put`.
