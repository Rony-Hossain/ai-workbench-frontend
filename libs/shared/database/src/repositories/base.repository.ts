import { eq, SQL } from 'drizzle-orm';
import { db } from '../client';
import type { BaseEntity } from '@ai-workbench-frontend/bounded-contexts';

/**
 * Base repository for common CRUD operations
 * Maps between database rows and domain types
 */
export abstract class BaseRepository<
  TTable extends { id: any },
  TDomain extends BaseEntity,
  TRow
> {
  constructor(protected table: TTable) {}

  /**
   * Convert database row to domain type
   */
  protected abstract toDomain(row: TRow): TDomain;

  /**
   * Convert domain type to database row (for inserts)
   */
  protected abstract toDatabase(domain: Partial<TDomain>): Partial<TRow>;

  async findById(id: string): Promise<TDomain | undefined> {
    const results = await db.select().from(this.table).where(eq(this.table.id, id)).limit(1);
    const row = results[0] as TRow | undefined;
    return row ? this.toDomain(row) : undefined;
  }

  async findAll(): Promise<TDomain[]> {
    const rows = await db.select().from(this.table).all();
    return rows.map(row => this.toDomain(row as TRow));
  }

  async create(data: Partial<TDomain>): Promise<TDomain> {
    const dbData = this.toDatabase(data);
    const result = await db.insert(this.table).values(dbData as any).returning();
    return this.toDomain(result[0] as TRow);
  }

  async update(id: string, data: Partial<TDomain>): Promise<TDomain | undefined> {
    const dbData = this.toDatabase(data);
    const result = await db
      .update(this.table)
      .set({ ...dbData, updatedAt: new Date() } as any)
      .where(eq(this.table.id, id))
      .returning();
    return result[0] ? this.toDomain(result[0] as TRow) : undefined;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(this.table).where(eq(this.table.id, id));
    return result.changes > 0;
  }

  async exists(id: string): Promise<boolean> {
    const result = await db
      .select({ id: this.table.id })
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);
    return result.length > 0;
  }
}
