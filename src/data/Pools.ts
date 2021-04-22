import { Tick } from '@uniswap/v3-sdk'
import { ZERO_ADDRESS } from './../constants/index'
import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useActiveWeb3React } from '../hooks'
import { useSingleCallResult } from '../state/multicall/hooks'
import { wrappedCurrency } from '../utils/wrappedCurrency'
import { Pool, FeeAmount, computePoolAddress } from '@uniswap/v3-sdk'
import { useV3Factory, useV3Pool } from 'hooks/useContract'
import { V3_CORE_FACTORY_ADDRESSES } from 'constants/v3'
import { useAllV3Ticks } from 'hooks/useAllV3Ticks'

export enum PoolState {
  LOADING = 'LOADING',
  NOT_EXISTS = 'NOT_EXISTS',
  EXISTS = 'EXISTS',
  INVALID = 'INVALID',
}

export function usePool(currencyA?: Currency, currencyB?: Currency, feeAmount?: FeeAmount): [PoolState, Pool | null] {
  const { chainId } = useActiveWeb3React()
  const factoryContract = useV3Factory()

  const tokenA = wrappedCurrency(currencyA, chainId)
  const tokenB = wrappedCurrency(currencyB, chainId)

  // sorted version
  const [token0, token1] = useMemo(
    () =>
      tokenA && tokenB && !tokenA.equals(tokenB)
        ? tokenA.sortsBefore(tokenB)
          ? [tokenA, tokenB]
          : [tokenB, tokenA]
        : [undefined, undefined],
    [tokenA, tokenB]
  )

  // fetch all generated addresses for pools
  const poolAddress = useMemo(() => {
    try {
      const addr = chainId && V3_CORE_FACTORY_ADDRESSES[chainId]
      return addr && tokenA && tokenB && feeAmount && !tokenA.equals(tokenB)
        ? computePoolAddress({
            factoryAddress: addr,
            tokenA,
            tokenB,
            fee: feeAmount,
          })
        : undefined
    } catch {
      return undefined
    }
  }, [chainId, feeAmount, tokenA, tokenB])

  const poolContract = useV3Pool(poolAddress)

  // check factory if pools exists
  const addressParams = token0 && token1 && feeAmount ? [token0.address, token1.address, feeAmount] : undefined
  const addressFromFactory = useSingleCallResult(addressParams ? factoryContract : undefined, 'getPool', addressParams)

  // attempt to fetch pool metadata
  const slot0Datas = useSingleCallResult(poolContract, 'slot0')

  // fetch additional data to instantiate pools
  const liquidityDatas = useSingleCallResult(poolContract, 'liquidity')

  const { result: slot0, loading: slot0Loading } = slot0Datas
  const { result: liquidityResult, loading: liquidityLoading } = liquidityDatas
  const { result: addressesResult, loading: addressesLoading } = addressFromFactory

  const liquidity = liquidityResult?.[0]
  const poolAddressFromFactory = addressesResult?.[0]

  // fetch tick data for pool
  const { tickData, loading: tickLoading, syncing: tickSyncing } = useAllV3Ticks(token0, token1, feeAmount)

  return useMemo(() => {
    // still loading data
    if (slot0Loading || addressesLoading || liquidityLoading || tickLoading || tickSyncing)
      return [PoolState.LOADING, null]

    // invalid pool setup
    if (!tokenA || !tokenB || !feeAmount || tokenA.equals(tokenB)) return [PoolState.INVALID, null]

    // pool has not been created or not initialized yet
    if (poolAddressFromFactory === ZERO_ADDRESS || !slot0 || !liquidity || slot0.sqrtPriceX96 === 0) {
      return [PoolState.NOT_EXISTS, null]
    }

    const tickList: Tick[] = tickData
      .map((tick) => {
        return new Tick({
          index: tick.tick,
          liquidityGross: tick.liquidityGross,
          liquidityNet: tick.liquidityNet,
        })
      })
      .sort((tickA, tickB) => (tickA.index > tickB.index ? 1 : -1))

    return [PoolState.EXISTS, new Pool(tokenA, tokenB, feeAmount, slot0.sqrtPriceX96, liquidity, slot0.tick, tickList)]
  }, [
    addressesLoading,
    feeAmount,
    liquidity,
    liquidityLoading,
    poolAddressFromFactory,
    slot0,
    slot0Loading,
    tickData,
    tickLoading,
    tickSyncing,
    tokenA,
    tokenB,
  ])
}
