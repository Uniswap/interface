import { Chain } from 'graphql/data/__generated__/types-and-hooks'
import { CHAIN_NAME_TO_CHAIN_ID } from 'graphql/data/util'

export function getNativeTokenDBAddress(chain: Chain): string | undefined {
  const pageChainId = CHAIN_NAME_TO_CHAIN_ID[chain]
  if (pageChainId === undefined) {
    return undefined
  }
  switch (chain) {
    case "ROLLUX" as Chain:
    default:
      return undefined
  }
}
