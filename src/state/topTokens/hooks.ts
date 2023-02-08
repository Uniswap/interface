import { Token } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo } from 'react'

import { KS_SETTING_API } from 'constants/env'
import { SUPPORTED_NETWORKS } from 'constants/networks'
import { CORRELATED_COINS_ADDRESS, STABLE_COINS_ADDRESS, SUPER_STABLE_COINS_ADDRESS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import { updateTopTokens } from '.'
import { PairFactor, TopToken } from './type'

const validateAPI = (tokens: TopToken[]): boolean => {
  return tokens.every(
    token =>
      SUPPORTED_NETWORKS.includes(token.chainId) &&
      typeof token.address === 'string' &&
      typeof token.symbol === 'string' &&
      typeof token.name === 'string' &&
      typeof token.decimals === 'number' &&
      typeof token.marketCap === 'number' &&
      typeof token.logoURI === 'string' &&
      typeof token.isWhitelisted === 'boolean',
  )
}

export const useTopTokens = (): {
  [address: string]: Token
} => {
  const { chainId } = useActiveWeb3React()
  const topTokens = useAppSelector(state => state.topTokens[chainId])
  const dispatch = useAppDispatch()

  useEffect(() => {
    const fetchTopTokens = async () => {
      const res = await fetch(`${KS_SETTING_API}/v1/tokens/popular?chainId=${chainId}&page=1`, {
        method: 'GET',
      }).then(res => res.json())

      if (res?.data?.tokens?.length) {
        if (!validateAPI(res.data.tokens)) {
          console.error('Validate top tokens API failed', res)
        } else {
          dispatch(updateTopTokens({ chainId, topTokens: res.data.tokens }))
        }
      }
    }

    fetchTopTokens()
  }, [chainId, dispatch])

  return useMemo(() => {
    if (!topTokens) return {}
    return topTokens.reduce((acc, topToken: TopToken) => {
      const token = new Token(topToken.chainId, topToken.address, topToken.decimals, topToken.symbol, topToken.name)
      acc[token.address] = token
      acc[token.address.toLowerCase()] = token
      return acc
    }, {} as { [address: string]: Token })
  }, [topTokens])
}

export const usePairFactor = (tokens: [Token | undefined | null, Token | undefined | null]): PairFactor => {
  // stable: - stable/stable
  //         - correlated
  // normal: - token/token in top 50 & not stable
  // exotic: other cases
  //         - token / token
  //         - token / stable
  //         - token / non-whitelisted
  //         - non-whitelisted / non-whitelisted
  const { chainId } = useActiveWeb3React()
  const topTokens = useTopTokens()
  const token0 = tokens[0]
  const token1 = tokens[1]

  if (!token0 || !token1) return PairFactor.EXOTIC

  const isBothSuperStable =
    SUPER_STABLE_COINS_ADDRESS[chainId].includes(token0.address) &&
    SUPER_STABLE_COINS_ADDRESS[chainId].includes(token1.address)
  if (isBothSuperStable) return PairFactor.SUPER_STABLE

  const isBothStable =
    STABLE_COINS_ADDRESS[chainId].includes(token0.address) && STABLE_COINS_ADDRESS[chainId].includes(token1.address)
  const isCorrelated = CORRELATED_COINS_ADDRESS[chainId].some(
    coinsGroup => coinsGroup.includes(token0.address) && coinsGroup.includes(token1.address),
  )
  if (isBothStable || isCorrelated) return PairFactor.STABLE

  const isBothTop =
    topTokens[token0.address] &&
    topTokens[token1.address] &&
    !STABLE_COINS_ADDRESS[chainId].includes(token0.address) &&
    !STABLE_COINS_ADDRESS[chainId].includes(token1.address)
  if (isBothTop) return PairFactor.NOMAL

  return PairFactor.EXOTIC
}
