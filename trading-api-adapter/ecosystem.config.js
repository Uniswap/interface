// pm2 process file for the HookSwap Trading API adapter (VPS, non-Docker path).
// Usage: pm2 start ecosystem.config.js --update-env  (after `npm run build`)
// Env is loaded from .env + config/rpc.env by the shell/systemd; pm2 inherits process.env.
module.exports = {
  apps: [
    {
      name: 'hookswap-trading-api',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: '4000',
      },
    },
  ],
}
