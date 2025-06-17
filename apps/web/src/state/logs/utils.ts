import type { Filter } from '@ethersproject/providers'

export interface Log {
  topics: Array<string>
  data: string
  transactionIndex: number
  logIndex: number
  blockNumber: number
}

/**
 * Converts a filter to the corresponding string key
 * @param filter the filter to convert
 */
export function filterToKey(filter: Filter): string {
  return `${filter.address ?? ''}:${
    filter.topics?.map((topic) => (topic ? (Array.isArray(topic) ? topic.join(';') : topic) : '\0')).join('-') ?? ''
  }:${filter.fromBlock ?? ''}:${filter.toBlock ?? ''}`
}

/**
 * Convert a filter key to the corresponding filter
 * @param key key to convert
 */
export function keyToFilter(key: string): Filter {
  const pcs = key.split(':')
  const address = pcs[0]
  const topics = pcs[1].split('-').map((topic) => {
    if (topic === '\0') {
      return null
    }
    const parts = topic.split(';')
    if (parts.length === 1) {
      return parts[0]
    }
    return parts
  })
  const fromBlock = pcs[2]
  const toBlock = pcs[3]

  return {
    address: address.length === 0 ? undefined : address,
    topics,
    fromBlock: fromBlock.length === 0 ? undefined : fromBlock,
    toBlock: toBlock.length === 0 ? undefined : toBlock,
  }
}

/**
 * Determines whether a filter is for a historical log that doesn't need to be re-fetched.
 * @param filter The filter to check.
 * @param blockNumber The current block number.
 */
export function isHistoricalLog(filter: Filter, blockNumber: number): boolean {
  if (!filter.toBlock) {
    return false
  }

  let toBlock = filter.toBlock
  if (typeof toBlock === 'string') {
    toBlock = Number.parseInt(toBlock)
  }
  return toBlock <= blockNumber
}
