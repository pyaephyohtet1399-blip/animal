module.exports = {
  apps: [
    {
      name: 'livestock-api',
      script: './src/server.js',
      instances: 4,
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 35000,
      env_production: { NODE_ENV: 'production' }
    }
  ]
};
