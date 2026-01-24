# ClariSend Web

## First-time setup

```bash
npm ci
npx prisma generate
npm run build
pm2 start ops/ecosystem.config.cjs --env production
pm2 save
```

## Development

```bash
npm run dev
```

## Production

Build and start:

```bash
npm run build
npm run start:prod
```

Production expects:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_MARKETING_URL`

`DATABASE_URL` is required for DB-backed features. If it is missing, the server
still starts and `/api/status` reports `db.ok=false`.

You can supply env values via `/etc/clarisend/clarisend-web.env`.

## PM2

Start or reload:

```bash
pm2 start ops/ecosystem.config.cjs --env production
pm2 reload clarisend-web --update-env
```

Status and logs:

```bash
pm2 status
pm2 logs clarisend-web
```

Default log locations:

- `~/.pm2/logs/clarisend-web-out.log`
- `~/.pm2/logs/clarisend-web-error.log`

## Deploy

```bash
bash scripts/deploy.sh
```

## Smoke Checks

```bash
bash scripts/smoke.sh
```

Smoke checks expect:

- `/en` and `/fr` return 200 or 307
- `/api/assets` returns 200
- `/api/status` returns 200 JSON (can be degraded; `db.ok` may be false)

Set `BASE_URL` to target a non-default host or port.
