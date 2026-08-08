# Automated code scans

This project includes a Vercel-hosted scanner at `/api/code-scans` with two automation lanes:

1. **Report scans** create GitHub issues or discussions with findings.
2. **Fix scans** apply safe deterministic fixes on a `vercel-agent/*` branch and open a pull request.

## Required environment variables

Set these in Vercel Project Settings → Environment Variables:

- `GITHUB_TOKEN`: GitHub token or app installation token with repository access for issues, pull requests, contents, and discussions if you enable discussion creation.
- `CODE_SCAN_SECRET`: shared secret for manual requests via `x-code-scan-secret` or `?secret=`.
- `CRON_SECRET`: Vercel Cron bearer token. Scheduled cron requests are accepted when Vercel sends `Authorization: Bearer $CRON_SECRET`.

At least one of `CODE_SCAN_SECRET` or `CRON_SECRET` must be configured before the endpoint will run.

Optional overrides:

- `GITHUB_OWNER` defaults to `newsteps4them-arch`.
- `GITHUB_REPO` defaults to `team.forge`.
- `GITHUB_BRANCH` defaults to `main`.
- `CODE_SCAN_DRY_RUN=true` prevents artifact creation.
- `CODE_SCAN_MAX_FILES` limits scan breadth, capped at 120.
- `GITHUB_DISCUSSION_CATEGORY_ID` is required only when `artifact=discussion`.

## Manual runs

```bash
curl -X POST "https://<deployment-domain>/api/code-scans" \
  -H "content-type: application/json" \
  -H "x-code-scan-secret: $CODE_SCAN_SECRET" \
  -d '{"mode":"report","artifact":"issue"}'

curl -X POST "https://<deployment-domain>/api/code-scans" \
  -H "content-type: application/json" \
  -H "x-code-scan-secret: $CODE_SCAN_SECRET" \
  -d '{"mode":"fix","artifact":"pull_request"}'
```

The scheduled Vercel Cron jobs run weekly: report scans on Monday at 09:00 UTC and fix scans on Monday at 10:00 UTC.
