import { ChainId, Token } from '@ubeswap/sdk'
import mapValues from 'lodash/mapValues'

const makeTokens = (
  addresses: { [net in ChainId]: string },
  decimals: number,
  symbol: string,
  name: string
): { [net in ChainId]: Token } => {
  return mapValues(addresses, (tokenAddress, network) => {
    return new Token(parseInt(network), tokenAddress, decimals, symbol, name)
  })
}

export const UBE = makeTokens(
  {
    [ChainId.MAINNET]: '0x71e26d0E519D14591b9dE9a0fE9513A398101490',
    [ChainId.ALFAJORES]: '0x71e26d0E519D14591b9dE9a0fE9513A398101490',
    [ChainId.BAKLAVA]: '0x71e26d0E519D14591b9dE9a0fE9513A398101490',
  },
  18,
  'UBE',
  'Ubeswap'
)
