/**
 * Base entity interface - all entities extend this
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Soft deletable entity interface
 */
export interface SoftDeletable {
  isDeleted: boolean;
  deletedAt?: Date;
}

/**
 * Timestamped entity interface
 */
export interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Standard API response
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
