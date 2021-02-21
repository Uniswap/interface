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

// TODO(igm): update with real addresses
export const UBE = makeTokens(
  {
    [ChainId.MAINNET]: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    [ChainId.ALFAJORES]: '0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
    [ChainId.BAKLAVA]: '0x765DE816845861e75A25fCA122bb6898B8B1282a'
  },
  18,
  'cUSD',
  'Celo Dollar'
)
