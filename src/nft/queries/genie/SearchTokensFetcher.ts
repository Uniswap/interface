import { SupportedChainId } from 'constants/chains'
import { NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { checkWarning } from 'constants/tokenSafety'
import { searchTokens } from 'graphql/data/Search'
import { CHAIN_NAME_TO_CHAIN_ID } from 'graphql/data/util'

import { FungibleToken } from '../../types'

export const fetchSearchTokens = async (
  tokenQuery: string,
  chainId: number = SupportedChainId.MAINNET
): Promise<FungibleToken[]> => {
  //const url = `${process.env.REACT_APP_TEMP_API_URL}/tokens/search?tokenQuery=${tokenQuery}`

  // const r = await fetch(url, {
  //   method: 'GET',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  // })
  const tokens = await searchTokens(tokenQuery, chainId)
  const nativeToken = tokens.find((t) => !t.address)

  if (nativeToken) {
    const wrapped = nativeOnChain(chainId).wrapped
    tokens.push({ ...nativeToken, ...wrapped })
  }

  // TODO Undo favoritism
  return (
    tokens
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
        b.name === 'Uniswap' ? 1 : (b.volume24h ?? 0) - (a.volume24h ?? 0)
      ) ?? []
  )
}
