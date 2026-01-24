module.exports = {
  apps: [
    {
      name: "clarisend-web",
      cwd: "/opt/apps/currency-exchange-app/apps/web",
      script: "npm",
      args: "run start:prod",
      env: {
        NODE_ENV: "production",
        HOSTNAME: "0.0.0.0",
        PORT: "3000",
      },
      env_production: {
        NODE_ENV: "production",
        HOSTNAME: "0.0.0.0",
        PORT: "3000",
      },
    },
  ],
};
