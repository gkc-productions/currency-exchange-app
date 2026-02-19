module.exports = {
  apps: [
    {
      name: "clarisend-web",
      cwd: "/var/www/clarisend/apps/web",
      script: "node_modules/next/dist/bin/next",
      args: "start --port=3000",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      max_memory_restart: "300M",
      time: true,
    },
    {
      name: "clarisend-marketing",
      cwd: "/var/www/clarisend/apps/marketing",
      script: "node_modules/next/dist/bin/next",
      args: "start --port=3001",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
      },
      max_memory_restart: "300M",
      time: true,
    },
  ],
};
