const Redis = require('ioredis');

let redisOffline = false;
let warningLogged = false;

const getRedisConnection = () => {
  const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  const client = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    showFriendlyErrorStack: false
  });

  // Attach error listener to avoid "Unhandled error event" crash
  client.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
      redisOffline = true;
      if (!warningLogged) {
        console.warn('\n======================================================================');
        console.warn('[Warning] Local Redis is offline. BullMQ background queues will operate');
        console.warn('          in-process using synchronous simulated task workers.');
        console.warn('======================================================================\n');
        warningLogged = true;
      }
    } else {
      console.error('[Redis Error]', err.message);
    }
  });

  client.on('connect', () => {
    redisOffline = false;
    console.log('[Redis] Connected successfully.');
  });

  return client;
};

const isRedisOffline = () => {
  return redisOffline;
};

module.exports = {
  getRedisConnection,
  isRedisOffline,
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
};
