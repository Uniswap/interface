export const formatSymbol = (symbol: string | undefined, placeholder?: string): string | undefined => {
  return !symbol ? placeholder : symbol.length > 20 ? symbol.slice(0, 4) + '...' + symbol.slice(symbol.length - 5, symbol.length) : symbol
}