/**
 * Storage driver interface for key-value storage
 * Platform-specific implementations handle the actual storage mechanism
 */
export interface StorageDriver {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}
