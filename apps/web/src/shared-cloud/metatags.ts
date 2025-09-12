export type MetaTagInjectorInput = {
  title: string
  image?: string
  url: string
  description?: string
}

export function formatTokenMetatagTitleName(symbol: string | undefined, name: string | undefined) {
  if (symbol) {
    return 'Get ' + symbol + ' on JuiceSwap'
  }
  if (name) {
    return 'Get ' + name + ' on JuiceSwap'
  }
  return 'View Token on JuiceSwap'
}
