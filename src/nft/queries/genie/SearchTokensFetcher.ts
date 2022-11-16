import { SupportedChainId } from 'constants/chains'
import { NATIVE_CHAIN_ID, nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { checkWarning } from 'constants/tokenSafety'
import { searchTokens } from 'graphql/data/Search'
import { CHAIN_NAME_TO_CHAIN_ID } from 'graphql/data/util'

import { FungibleToken } from '../../types'

export const fetchSearchTokens = async (
  tokenQuery: string,
  chainId: number = SupportedChainId.MAINNET
): Promise<FungibleToken[]> => {
  const tokens = await searchTokens(tokenQuery, chainId)

  const nativeResults = []
  const otherResults = []

  let nativeToken
  let hasWrapped = false
  for (let i = 0; i < tokens.length; i++) {
    const currentChainId = CHAIN_NAME_TO_CHAIN_ID[tokens[i].chain]
    if (tokens[i].standard === 'NATIVE') {
      const parsedNative = { ...tokens[i], ...nativeOnChain(currentChainId), address: NATIVE_CHAIN_ID }
      nativeResults.push(parsedNative)
      nativeToken = parsedNative
    } else if (WRAPPED_NATIVE_CURRENCY[currentChainId]?.address === tokens[i].address) {
      if (!nativeToken) nativeToken = { ...tokens[i], ...nativeOnChain(currentChainId), address: NATIVE_CHAIN_ID }
      hasWrapped = true
    } else {
      otherResults.push(tokens[i])
    }
  }

  if (nativeToken && !hasWrapped) {
    nativeResults.push({ ...nativeToken, ...WRAPPED_NATIVE_CURRENCY[nativeToken.chainId] })
  }

  // TODO Undo favoritism
  return (
    [...nativeResults, ...otherResults]
      .map(
        (t): FungibleToken => ({
          ...t,
          address: t.address ?? NATIVE_CHAIN_ID,
          chainId: CHAIN_NAME_TO_CHAIN_ID[t?.chain],
          priceUsd: t.market?.price?.value ?? undefined,
          price24hChange: t.market?.pricePercentChange?.value,
          volume24h: t.market?.volume24H?.value,
          onDefaultList: t.address ? !checkWarning(t.address) : true,
        })
      )
      .sort((a: FungibleToken, b: FungibleToken) =>
        b.name === 'Uniswap' || b.address === NATIVE_CHAIN_ID ? 1 : (b.volume24h ?? 0) - (a.volume24h ?? 0)
      ) ?? []
  )
}
