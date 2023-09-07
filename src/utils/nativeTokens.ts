import { nativeOnChain } from 'constants/tokens'
import { Chain } from 'graphql/data/__generated__/types-and-hooks'
import { supportedChainIdFromGQLChain } from 'graphql/data/util'

export function getNativeTokenDBAddress(chain: Chain): string | undefined {
  const pageChainId = supportedChainIdFromGQLChain(chain)
  if (pageChainId === undefined) {
    return undefined
  }
  switch (chain) {
    case Chain.Kava:
      return nativeOnChain(pageChainId).wrapped.address
    default:
      return undefined
  }
}
