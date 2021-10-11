import { ICache } from '@uniswap/smart-order-router'

//TODO(judo): add tests
export class MemoryCache<T> implements ICache<T> {
  private cache: Record<string, { val: T; added: number; timeout?: ReturnType<typeof setTimeout> }> = {}

  constructor(private ttl?: number) {}

  async get(key: string) {
    const rec = this.cache[key]

    if (this.ttl) {
      return !(rec?.added && rec?.added + this.ttl > Date.now()) ? rec?.val : undefined
    } else {
      return rec?.val
    }
  }

  async set(key: string, value: T) {
    this.cache[key] = {
      val: value,
      added: Date.now(),
      timeout: this.ttl ? setTimeout(() => this.del(key), this.ttl) : undefined,
    }

    return true
  }

  async has(key: string) {
    return Boolean(this.cache[key])
  }

  del(key: string) {
    const rec = this.cache[key]

    if (!rec) return
    if (rec.timeout) clearTimeout(rec.timeout)

    delete this.cache[key]
  }
}
