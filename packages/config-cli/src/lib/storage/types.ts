import type { Result } from 'better-result'

/**
 * Generic key/value storage shape. Concrete storages (keychain, filesystem, ...) alias
 * this with their own error type so callers can distinguish failures by backing.
 */
export interface Storage<E> {
  set(key: string, value: string): Promise<Result<void, E>>
  get(key: string): Promise<Result<string, E>>
  delete(key: string): Promise<Result<void, E>>
}
