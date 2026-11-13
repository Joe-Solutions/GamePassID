module.exports = {
  apps: [
    {
      name: "gamepassid",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3210",
      cwd: "/var/www/GamePassID",
      env: {
        NODE_ENV: "production",
        PORT: 3210,
      },
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "400M",
    },
  ],
};
