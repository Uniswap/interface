import { LiquidityMiningCampaign, Pair, PricedToken, PricedTokenAmount, Token, TokenAmount } from '@swapr/sdk'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'
import { useNativeCurrencyPricedTokenAmounts } from './useTokensDerivedNativeCurrency'
import { usePairLiquidityTokenTotalSupply } from '../data/Reserves'
import { getLpTokenPrice } from '../utils/prices'
import { useNativeCurrency } from './useNativeCurrency'
import { usePairReserveNativeCurrency } from './usePairReserveNativeCurrency'
import { gql, useQuery } from '@apollo/client'
import { SubgraphLiquidityMiningCampaign } from '../apollo'
import { getAddress, parseUnits } from 'ethers/lib/utils'

const QUERY = gql`
  query($id: ID) {
    liquidityMiningCampaign(id: $id) {
      address: id
      duration
      startsAt
      endsAt
      locked
      stakingCap
      rewardTokens {
        address: id
        name
        symbol
        decimals
        derivedNativeCurrency
      }
      stakedAmount
      rewardAmounts
    }
  }
`

interface QueryResult {
  liquidityMiningCampaign: SubgraphLiquidityMiningCampaign
}

// the id is the campaign's smart contract address
export function useLiquidityMiningCampaign(
  targetedPair?: Pair,
  id?: string
): { loading: boolean; campaign: LiquidityMiningCampaign | null } {
  const { chainId } = useActiveWeb3React()
  const { loading, error, data } = useQuery<QueryResult>(QUERY, {
    variables: { id: id?.toLowerCase() || '' }
  })
  const nativeCurrency = useNativeCurrency()
  const rewards = useMemo(() => {
    if (!data || !chainId || !data.liquidityMiningCampaign) return []
    const { rewardAmounts, rewardTokens: rawRewardTokens } = data.liquidityMiningCampaign
    const rewardTokens = rawRewardTokens.map(
      rawToken =>
        new Token(chainId, getAddress(rawToken.address), parseInt(rawToken.decimals), rawToken.symbol, rawToken.name)
    )
    return rewardAmounts.map(
      (amount, index) =>
        new TokenAmount(rewardTokens[index], parseUnits(amount, rewardTokens[index].decimals).toString())
    )
  }, [chainId, data])
  const { pricedTokenAmounts: pricedRewardAmounts } = useNativeCurrencyPricedTokenAmounts(rewards)
  const lpTokenTotalSupply = usePairLiquidityTokenTotalSupply(targetedPair)
  const { reserveNativeCurrency: targetedPairReserveNativeCurrency } = usePairReserveNativeCurrency(targetedPair)

  return useMemo(() => {
    if (loading || !chainId || !targetedPair || !lpTokenTotalSupply) return { loading: true, campaign: null }
    if (error || !data) return { loading: false, campaign: null }
    const lpTokenNativeCurrencyPrice = getLpTokenPrice(
      targetedPair,
      nativeCurrency,
      lpTokenTotalSupply.raw.toString(),
      targetedPairReserveNativeCurrency.raw.toString()
    )
    const { address, decimals, symbol, name } = targetedPair.liquidityToken
    const lpToken = new PricedToken(chainId, address, decimals, lpTokenNativeCurrencyPrice, symbol, name)
    const staked = new PricedTokenAmount(
      lpToken,
      parseUnits(data.liquidityMiningCampaign.stakedAmount, decimals).toString()
    )
    return {
      loading: false,
      campaign: new LiquidityMiningCampaign(
        data.liquidityMiningCampaign.startsAt,
        data.liquidityMiningCampaign.endsAt,
        targetedPair,
        pricedRewardAmounts,
        staked,
        data.liquidityMiningCampaign.locked,
        new TokenAmount(
          targetedPair.liquidityToken,
          parseUnits(data.liquidityMiningCampaign.stakingCap, decimals).toString()
        ),
        getAddress(data.liquidityMiningCampaign.address)
      )
    }
  }, [
    chainId,
    data,
    error,
    loading,
    lpTokenTotalSupply,
    nativeCurrency,
    pricedRewardAmounts,
    targetedPair,
    targetedPairReserveNativeCurrency.raw
  ])
}
