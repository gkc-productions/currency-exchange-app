# ClariSend Infra Notes

## Runtime ports
- `apps/web` (app + API): `127.0.0.1:3000`
- `apps/marketing` (marketing site): `127.0.0.1:3001`

## Nginx routing
- `https://app.clarisend.co` -> `127.0.0.1:3000`
- `https://clarisend.co` -> `127.0.0.1:3001`
- `https://clarisend.co/api/*` -> `127.0.0.1:3000`
- `https://www.clarisend.co` -> redirects to `https://clarisend.co`

## Deploy
- Run `npm run deploy` from `apps/web`

## PM2 operations
- Reload apps: `npm run pm2:reload`
- Check status: `npm run pm2:status`
- Logs: `pm2 logs clarisend-web` and `pm2 logs clarisend-marketing`
