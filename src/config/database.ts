import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

// MongoDB connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Connection URLs from environment variables
const PRIMARY_DB_URI = process.env.PRIMARY_MONGODB_URI || 'mongodb://localhost:27017/primary_db';
const SECONDARY_DB_URI = process.env.SECONDARY_MONGODB_URI || 'mongodb://localhost:27017/secondary_db';

// Create connection instances
const primaryConnection = mongoose.createConnection(PRIMARY_DB_URI, options);
const secondaryConnection = mongoose.createConnection(SECONDARY_DB_URI, options);

// Connection event handlers for primary database
primaryConnection.on('connected', () => {
  logger.info('Connected to primary MongoDB database');
});

primaryConnection.on('error', (err) => {
  logger.error('Primary MongoDB connection error:', { error: err.message, stack: err.stack });
});

primaryConnection.on('disconnected', () => {
  logger.warn('Disconnected from primary MongoDB database');
});

// Connection event handlers for secondary database
secondaryConnection.on('connected', () => {
  logger.info('Connected to secondary MongoDB database');
});

secondaryConnection.on('error', (err) => {
  logger.error('Secondary MongoDB connection error:', { error: err.message, stack: err.stack });
});

secondaryConnection.on('disconnected', () => {
  logger.warn('Disconnected from secondary MongoDB database');
});

// Handle application termination
process.on('SIGINT', async () => {
  await primaryConnection.close();
  await secondaryConnection.close();
  logger.info('MongoDB connections closed due to application termination');
  process.exit(0);
});

export { primaryConnection, secondaryConnection };