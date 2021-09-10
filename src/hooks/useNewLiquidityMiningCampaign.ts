import { LiquidityMiningCampaign, Pair, PricedToken, PricedTokenAmount, TokenAmount } from '@swapr/sdk'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'
import { useNativeCurrencyPricedTokenAmounts } from './useTokensDerivedNativeCurrency'
import { usePairLiquidityTokenTotalSupply } from '../data/Reserves'
import { getLpTokenPrice } from '../utils/prices'
import { useNativeCurrency } from './useNativeCurrency'
import { usePairReserveNativeCurrency } from './usePairReserveNativeCurrency'

export function useNewLiquidityMiningCampaign(
  targetedPair: Pair | null,
  rewards: TokenAmount[],
  startTime: Date | null,
  endTime: Date | null,
  locked: boolean,
  stakingCap: TokenAmount | null
): LiquidityMiningCampaign | null {
  const { chainId } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
  const { pricedTokenAmounts: pricedRewardAmounts } = useNativeCurrencyPricedTokenAmounts(rewards)
  const lpTokenTotalSupply = usePairLiquidityTokenTotalSupply(targetedPair || undefined)
  const { reserveNativeCurrency: targetedPairReserveNativeCurrency } = usePairReserveNativeCurrency()

  return useMemo(() => {
    if (!chainId || !targetedPair || !lpTokenTotalSupply || pricedRewardAmounts.length === 0 || !startTime || !endTime)
      return null
    const { address, symbol, name, decimals } = targetedPair.liquidityToken
    const lpTokenNativeCurrencyPrice = getLpTokenPrice(
      targetedPair,
      nativeCurrency,
      lpTokenTotalSupply.raw.toString(),
      targetedPairReserveNativeCurrency.raw.toString()
    )
    const lpToken = new PricedToken(chainId, address, decimals, lpTokenNativeCurrencyPrice, symbol, name)
    const staked = new PricedTokenAmount(lpToken, '0')
    return new LiquidityMiningCampaign(
      Math.floor(startTime.getTime() / 1000).toString(),
      Math.floor(endTime.getTime() / 1000).toString(),
      targetedPair,
      pricedRewardAmounts,
      staked,
      locked,
      stakingCap || new TokenAmount(targetedPair.liquidityToken, '0')
    )
  }, [
    chainId,
    targetedPair,
    lpTokenTotalSupply,
    pricedRewardAmounts,
    startTime,
    endTime,
    stakingCap,
    nativeCurrency,
    targetedPairReserveNativeCurrency.raw,
    locked
  ])
}
