export type MetaTagInjectorInput = {
  title: string
  image?: string
  url: string
  description?: string
}

export function formatTokenMetatagTitleName(symbol: string | undefined, name: string | undefined) {
  if (symbol) {
    return 'Get ' + symbol + ' on HookSwap'
  }
  if (name) {
    return 'Get ' + name + ' on HookSwap'
  }
  return 'View Token on HookSwap'
}

export function formatAuctionMetatagTitleName(symbol: string | undefined, name: string | undefined) {
  if (symbol) {
    return 'Bid on ' + symbol + ' on HookSwap'
  }
  if (name) {
    return 'Bid on ' + name + ' on HookSwap'
  }
  return 'Bid in a HookSwap auction'
}
