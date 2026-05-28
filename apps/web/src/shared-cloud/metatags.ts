export type MetaTagInjectorInput = {
  title: string
  image?: string
  url: string
  description?: string
}

export function formatTokenMetatagTitleName(symbol: string | undefined, name: string | undefined) {
  if (symbol) {
    return 'Get ' + symbol + ' on Ring'
  }
  if (name) {
    return 'Get ' + name + ' on Ring'
  }
  return 'View Token on Ring'
}
