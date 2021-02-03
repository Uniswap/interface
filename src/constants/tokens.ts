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

export const CUSD = makeTokens(
  {
    [ChainId.MAINNET]: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    [ChainId.ALFAJORES]: '0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
    [ChainId.BAKLAVA]: '0x62492a644a588fd904270bed06ad52b9abfea1ae'
  },
  18,
  'cUSD',
  'Celo Dollar'
)

export const CELO = makeTokens(
  {
    [ChainId.MAINNET]: '0x471EcE3750Da237f93B8E339c536989b8978a438',
    [ChainId.ALFAJORES]: '0xf194afdf50b03e69bd7d057c1aa9e10c9954e4c9',
    [ChainId.BAKLAVA]: '0xddc9be57f553fe75752d61606b94cbd7e0264ef8'
  },
  18,
  'cUSD',
  'Celo Dollar'
)

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
