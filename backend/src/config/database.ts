import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';

let connection: mysql.Connection;

export async function connectDatabase(): Promise<mysql.Connection> {
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'exeloka',
      charset: 'utf8mb4'
    });

    logger.info('Database connection established');
    return connection;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

export function getConnection(): mysql.Connection {
  if (!connection) {
    throw new Error('Database not connected');
  }
  return connection;
}