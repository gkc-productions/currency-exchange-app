# ClariSend Ops Runbook

Build
- cd /opt/apps/currency-exchange-app/apps/web
- npm run build

Start dev
- cd /opt/apps/currency-exchange-app/apps/web
- npm run dev

Start prod with PM2
- cd /opt/apps/currency-exchange-app/apps/web
- npm run pm2:prod

Stop / restart PM2
- cd /opt/apps/currency-exchange-app/apps/web
- npm run pm2:stop
- npm run pm2:restart

Resolve EADDRINUSE on 3000
- lsof -i :3000 -n -P
- kill -TERM <PID>
- kill -9 <PID>  # only if it will not stop
