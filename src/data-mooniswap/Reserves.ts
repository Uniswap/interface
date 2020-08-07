import { Pair, Token, TokenAmount } from '@uniswap/sdk'
import { useMemo } from 'react'
import { useActiveWeb3React } from '../hooks'

import { NEVER_RELOAD, useSingleCallResult } from '../state/multicall/hooks'
import { useMooniswapV1HelperContract } from '../hooks/useContract'
// @ts-ignore
import { V1_MOONISWAP_FACTORY_ADDRESSES } from '../constants/v1-mooniswap'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}

export function usePairs(currencies: [Token | undefined, Token | undefined][]): [PairState, Pair | null][] {
  const { chainId } = useActiveWeb3React()

  const tokenAList: string[] = []
  const tokenBList: string[] = []
  const allTokenAList: (Token | undefined)[] = []
  const allTokenBList: (Token | undefined)[] = []
  for (let i = 0; i < currencies.length; i++) {
    const [tokenA, tokenB] = currencies[i]
    allTokenAList.push(tokenA)
    allTokenBList.push(tokenB)
    if (!tokenA || !tokenB) continue
    if (tokenA.equals(tokenB)) continue
    tokenAList.push(tokenA.address)
    tokenBList.push(tokenB.address)
  }

  const res = useSingleCallResult(useMooniswapV1HelperContract(), 'getPoolDataList', [
    V1_MOONISWAP_FACTORY_ADDRESSES[chainId || 1],
    tokenAList,
    tokenBList
  ], NEVER_RELOAD)

  return useMemo(() => {
    if (res.loading) return [[PairState.LOADING, null]]

    const poolDataList = res.result?.[0]
    let counter = 0

    const pairStates: [PairState, Pair | null][] = []
    for (let i = 0; i < allTokenAList.length; i++) {

      const tokenA = allTokenAList[i]
      const tokenB = allTokenBList[i]
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) {
        pairStates.push([PairState.INVALID, null])
        continue
      }

      const poolData = poolDataList?.[counter]
      counter++
      if (!poolData) {
        pairStates.push([PairState.LOADING, null])
        continue
      }

      const poolAddress = poolData.pool
      if (poolAddress === ZERO_ADDRESS) {
        pairStates.push([PairState.NOT_EXISTS, null])
        continue
      }

      pairStates.push([
        PairState.EXISTS,
        new Pair(
          new TokenAmount(tokenA, poolData.balanceA.toString()),
          new TokenAmount(tokenB, poolData.balanceB.toString()),
          poolAddress
        )
      ])
    }
    return pairStates
  }, [res, allTokenAList, allTokenBList])
}

export function usePair(tokenA?: Token, tokenB?: Token): [PairState, Pair | null] {
  return usePairs([[tokenA, tokenB]])[0]
}
