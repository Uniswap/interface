import NodeCache from 'node-cache'

import { ICache } from './cache'

export class NodeJSCache<T> implements ICache<T> {
  constructor(private nodeCache: NodeCache) {}

  async get(key: string): Promise<T | undefined> {
    return this.nodeCache.get<T>(key)
  }

  async batchGet(keys: Set<string>): Promise<Record<string, T | undefined>> {
    const keysArr = Array.from(keys)
    const values = await Promise.all(keysArr.map((key) => this.get(key)))

    const result: Record<string, T | undefined> = {}

    keysArr.forEach((key, index) => {
      result[key] = values[index]
    })

    return result
  }

  async set(key: string, value: T, ttl?: number): Promise<boolean> {
    if (ttl) {
      return this.nodeCache.set(key, value, ttl)
    } else {
      return this.nodeCache.set(key, value)
    }
  }

  async has(key: string): Promise<boolean> {
    return this.nodeCache.has(key)
  }
}
