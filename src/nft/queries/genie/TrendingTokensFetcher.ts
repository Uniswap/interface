import { SupportedChainId } from 'constants/chains'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { checkWarning } from 'constants/tokenSafety'
import { getTrendingTokens } from 'graphql/data/Trending'
import { unwrapToken } from 'graphql/data/util'

import { FungibleToken } from '../../types'

export const fetchTrendingTokens = async (
  numTokens: number,
  chainId: number = SupportedChainId.MAINNET
): Promise<FungibleToken[]> => {
  const tokens = await getTrendingTokens(numTokens, chainId)

  return tokens
    .map((token) => unwrapToken(chainId, token))
    .map(
      (t): FungibleToken => ({
        ...t,
        address: t.address ?? NATIVE_CHAIN_ID,
        chainId,
        priceUsd: t.market?.price?.value ?? undefined,
        price24hChange: t.market?.pricePercentChange?.value,
        volume24h: t.market?.volume24H?.value,
        onDefaultList: t.address ? !checkWarning(t.address) : true,
        logoURI: t.project?.logoUrl,
      })
    )
}
