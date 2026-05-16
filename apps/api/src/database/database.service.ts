import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResultRow } from 'pg';
import { randomUUID } from 'crypto';

export type DbClient = Pool | PoolClient;

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const connectionString = this.config.get<string>('DATABASE_URL');
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    const useSsl =
      this.config.get<string>('DATABASE_SSL') !== 'false' &&
      !connectionString.includes('127.0.0.1') &&
      !connectionString.includes('localhost');

    this.pool = new Pool({
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      max: 10,
    });

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected database pool error', err);
    });
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }

  newId(): string {
    return randomUUID();
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = [],
    client?: DbClient,
  ): Promise<T[]> {
    const executor = client ?? this.pool;
    const result = await executor.query<T>(sql, params);
    return result.rows;
  }

  async queryOne<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = [],
    client?: DbClient,
  ): Promise<T | null> {
    const rows = await this.query<T>(sql, params, client);
    return rows[0] ?? null;
  }

  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
