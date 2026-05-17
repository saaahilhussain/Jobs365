module.exports = {
  apps: [
    {
      name: "jobs365-server",
      script: "app.js",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "500M",
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
