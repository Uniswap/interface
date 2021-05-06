import { useSingleCallResult } from 'state/multicall/hooks'
import { useMemo } from 'react'
import { PositionDetails } from 'types/position'
import { useV3Pool } from './useContract'
import { BigNumber } from '@ethersproject/bignumber'
import { computePoolAddress, Pool } from '@uniswap/v3-sdk'
import { V3_CORE_FACTORY_ADDRESSES } from 'constants/v3'
import { useActiveWeb3React } from 'hooks'
import { TokenAmount } from '@uniswap/sdk-core'

// TODO port these utility functions to the SDK

function subIn256(x: BigNumber, y: BigNumber): BigNumber {
  const difference = x.sub(y)
  return difference.lt(0) ? BigNumber.from(2).pow(256).add(difference) : difference
}

function getCounterfactualFees(
  feeGrowthGlobal: BigNumber,
  feeGrowthOutsideLower: BigNumber,
  feeGrowthOutsideUpper: BigNumber,
  feeGrowthInsideLast: BigNumber,
  pool: Pool,
  liquidity: BigNumber,
  tickLower: number,
  tickUpper: number
) {
  let feeGrowthBelow: BigNumber
  if (pool.tickCurrent >= tickLower) {
    feeGrowthBelow = feeGrowthOutsideLower
  } else {
    feeGrowthBelow = subIn256(feeGrowthGlobal, feeGrowthOutsideLower)
  }

  let feeGrowthAbove: BigNumber
  if (pool.tickCurrent < tickUpper) {
    feeGrowthAbove = feeGrowthOutsideUpper
  } else {
    feeGrowthAbove = subIn256(feeGrowthGlobal, feeGrowthOutsideUpper)
  }

  const feeGrowthInside = subIn256(subIn256(feeGrowthGlobal, feeGrowthBelow), feeGrowthAbove)

  return subIn256(feeGrowthInside, feeGrowthInsideLast).mul(liquidity).div(BigNumber.from(2).pow(128))
}

// compute current + counterfactual fees for a v3 position
export function useV3PositionFees(
  pool?: Pool,
  positionDetails?: PositionDetails
): [TokenAmount, TokenAmount] | [undefined, undefined] {
  const { chainId } = useActiveWeb3React()

  const poolAddress = useMemo(() => {
    try {
      return chainId && V3_CORE_FACTORY_ADDRESSES[chainId] && pool && positionDetails
        ? computePoolAddress({
            factoryAddress: V3_CORE_FACTORY_ADDRESSES[chainId] as string,
            tokenA: pool.token0,
            tokenB: pool.token1,
            fee: positionDetails.fee,
          })
        : undefined
    } catch {
      return undefined
    }
  }, [chainId, pool, positionDetails])
  const poolContract = useV3Pool(poolAddress)

  // data fetching
  const feeGrowthGlobal0: BigNumber | undefined = useSingleCallResult(poolContract, 'feeGrowthGlobal0X128')?.result?.[0]
  const feeGrowthGlobal1: BigNumber | undefined = useSingleCallResult(poolContract, 'feeGrowthGlobal1X128')?.result?.[0]
  const { feeGrowthOutside0X128: feeGrowthOutsideLower0 } = (useSingleCallResult(poolContract, 'ticks', [
    positionDetails?.tickLower,
  ])?.result ?? {}) as { feeGrowthOutside0X128?: BigNumber }
  const { feeGrowthOutside1X128: feeGrowthOutsideLower1 } = (useSingleCallResult(poolContract, 'ticks', [
    positionDetails?.tickLower,
  ])?.result ?? {}) as { feeGrowthOutside1X128?: BigNumber }
  const { feeGrowthOutside0X128: feeGrowthOutsideUpper0 } = (useSingleCallResult(poolContract, 'ticks', [
    positionDetails?.tickUpper,
  ])?.result ?? {}) as { feeGrowthOutside0X128?: BigNumber }
  const { feeGrowthOutside1X128: feeGrowthOutsideUpper1 } = (useSingleCallResult(poolContract, 'ticks', [
    positionDetails?.tickUpper,
  ])?.result ?? {}) as { feeGrowthOutside1X128?: BigNumber }

  // calculate fees
  const counterfactualFees0 =
    positionDetails && pool && feeGrowthGlobal0 && feeGrowthOutsideLower0 && feeGrowthOutsideUpper0
      ? getCounterfactualFees(
          feeGrowthGlobal0,
          feeGrowthOutsideLower0,
          feeGrowthOutsideUpper0,
          positionDetails.feeGrowthInside0LastX128,
          pool,
          positionDetails.liquidity,
          positionDetails.tickLower,
          positionDetails.tickUpper
        )
      : undefined
  const counterfactualFees1 =
    positionDetails && pool && feeGrowthGlobal1 && feeGrowthOutsideLower1 && feeGrowthOutsideUpper1
      ? getCounterfactualFees(
          feeGrowthGlobal1,
          feeGrowthOutsideLower1,
          feeGrowthOutsideUpper1,
          positionDetails.feeGrowthInside1LastX128,
          pool,
          positionDetails.liquidity,
          positionDetails.tickLower,
          positionDetails.tickUpper
        )
      : undefined

  if (
    pool &&
    positionDetails?.tokensOwed0 &&
    positionDetails?.tokensOwed1 &&
    counterfactualFees0 &&
    counterfactualFees1
  ) {
    return [
      new TokenAmount(pool.token0, positionDetails.tokensOwed0.add(counterfactualFees0).toString()),
      new TokenAmount(pool.token1, positionDetails.tokensOwed1.add(counterfactualFees1).toString()),
    ]
  } else {
    return [undefined, undefined]
  }
}
