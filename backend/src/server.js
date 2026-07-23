require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { startReceiptWorker } = require('./workers/receiptWorker');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start BullMQ Worker
    startReceiptWorker();
    console.log('[Worker] BullMQ receipt processing worker started.');

    // 3. Start Listening
    app.listen(PORT, () => {
      console.log(`[Server] ExpensePilot Backend listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });
  } catch (error) {
    console.error(`[Server] Boot failed: ${error.message}`);
    process.exit(1);
  }
};

start();
