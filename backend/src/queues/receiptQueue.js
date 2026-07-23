const { Queue } = require('bullmq');
const { getRedisConnection, isRedisOffline } = require('../config/redis');
const { processReceiptData } = require('../services/receiptProcessingService');

let receiptQueue = null;

try {
  const connection = getRedisConnection();
  receiptQueue = new Queue('receipt-processing', { connection });
  receiptQueue.on('error', () => {
    // Suppress queue wrapper reconnect errors
  });
} catch (err) {
  console.log('[Queue] Redis connection failed, queue client initialization skipped.');
}

const queueReceiptProcessing = async ({ receiptId, fileUrl, companyId, expenseId }) => {
  // If Redis is offline or Queue client initialization failed, use local in-process simulation
  if (isRedisOffline() || !receiptQueue) {
    console.log(`[Queue] Redis is offline. Processing Receipt: ${receiptId} in local simulation thread...`);
    
    // Simulate background queue delay (2.5 seconds) to retain frontend loading animations
    setTimeout(async () => {
      await processReceiptData({ receiptId, fileUrl, companyId, expenseId });
    }, 2500);
    return;
  }

  try {
    await receiptQueue.add(
      'process-receipt',
      { receiptId, fileUrl, companyId, expenseId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    );
  } catch (error) {
    console.warn(`[Queue] Enqueue failed (${error.message}). Invoking local fallback simulation...`);
    setTimeout(async () => {
      await processReceiptData({ receiptId, fileUrl, companyId, expenseId });
    }, 2500);
  }
};

module.exports = {
  queueReceiptProcessing
};
