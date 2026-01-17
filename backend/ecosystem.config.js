/**
 * PM2 Ecosystem Configuration for HostMaster Backend
 * 
 * Production deployment with separate API and Worker processes
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 stop all
 *   pm2 restart all
 *   pm2 logs
 */

module.exports = {
    apps: [
        {
            name: 'hostmaster-api',
            script: './src/server.js',
            instances: 2, // Scale based on CPU cores
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
                START_WORKERS: 'false' // Don't start workers in API process
            },
            error_file: './logs/api-error.log',
            out_file: './logs/api-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            max_memory_restart: '500M',
            watch: false,
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s'
        },
        {
            name: 'hostmaster-worker',
            script: './src/worker.js',
            instances: 1, // Start with 1, scale based on queue length
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production'
            },
            error_file: './logs/worker-error.log',
            out_file: './logs/worker-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            max_memory_restart: '1G',
            watch: false,
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s',
            kill_timeout: 5000 // Give workers time to finish current jobs
        }
    ]
};
