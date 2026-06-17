export type MetaTagInjectorInput = {
  title: string
  image?: string
  url: string
  description?: string
}

export function formatTokenMetatagTitleName(symbol: string | undefined, name: string | undefined) {
  if (symbol) {
    return 'Get ' + symbol + ' on Uniswap'
  }
  if (name) {
    return 'Get ' + name + ' on Uniswap'
  }
  return 'View Token on Uniswap'
}

export function formatAuctionMetatagTitleName(symbol: string | undefined, name: string | undefined) {
  if (symbol) {
    return 'Bid on ' + symbol + ' on Uniswap'
  }
  if (name) {
    return 'Bid on ' + name + ' on Uniswap'
  }
  return 'Bid in a Uniswap auction'
}
