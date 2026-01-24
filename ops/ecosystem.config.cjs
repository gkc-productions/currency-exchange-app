module.exports = {
  apps: [
    {
      name: "clarisend-web",
      cwd: "/opt/apps/currency-exchange-app/apps/web",
      script: "npm",
      args: "run start:prod",
      env_production: {
        NODE_ENV: "production",
        HOSTNAME: "0.0.0.0",
        PORT: "3000",
      },
      max_restarts: 10,
      restart_delay: 2000,
      time: true,
      autorestart: true,
      watch: false,
    },
  ],
};
