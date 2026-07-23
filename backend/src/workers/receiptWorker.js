const { Worker } = require('bullmq');
const { getRedisConnection, isRedisOffline } = require('../config/redis');
const { processReceiptData } = require('../services/receiptProcessingService');

const startReceiptWorker = () => {
  // If Redis is offline, defer BullMQ worker initialization to avoid connection loop spamming
  if (isRedisOffline()) {
    console.log('[Worker] Redis is offline. BullMQ queue worker deferred.');
    return null;
  }

  try {
    const connection = getRedisConnection();
    const worker = new Worker('receipt-processing', async (job) => {
      console.log(`[Worker] Processing job ${job.id}...`);
      await processReceiptData(job.data);
    }, {
      connection,
      concurrency: 2
    });

    worker.on('error', (err) => {
      // Register error listener to suppress unhandled reconnect logs
    });

    worker.on('completed', (job) => {
      console.log(`[Worker] Job ${job.id} completed successfully.`);
    });

    worker.on('failed', (job, err) => {
      console.warn(`[Worker] Job ${job.id} failed: ${err.message}`);
    });

    return worker;
  } catch (error) {
    console.warn(`[Worker] Failed to start BullMQ worker: ${error.message}`);
    return null;
  }
};

module.exports = {
  startReceiptWorker
};
