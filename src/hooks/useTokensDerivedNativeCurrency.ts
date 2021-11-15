import { gql, useQuery } from '@apollo/client'
import Decimal from 'decimal.js-light'
import { Price, PricedToken, PricedTokenAmount, TokenAmount } from '@swapr/sdk'
import { parseUnits } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'
import { useNativeCurrency } from './useNativeCurrency'
import { useKpiTokens } from './useKpiTokens'

interface DerivedNativeCurrencyQueryResult {
  tokens: [{ address: string; name: string; symbol: string; decimals: string; derivedNativeCurrency: string }]
}

export function useNativeCurrencyPricedTokenAmounts(
  tokenAmounts?: TokenAmount[] | null
): { loading: boolean; pricedTokenAmounts: PricedTokenAmount[] } {
  const { chainId } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
  const tokenIds = useMemo(() => {
    return tokenAmounts ? tokenAmounts.map(tokenAmount => tokenAmount.token.address.toLowerCase()) : []
  }, [tokenAmounts])
  const { loading: loadingKpiTokens, kpiTokens } = useKpiTokens(tokenIds)
  const { loading, data, error } = useQuery<DerivedNativeCurrencyQueryResult>(
    gql`
      query getTokensDerivedNativeCurrency($tokenIds: [ID!]!) {
        tokens(where: { id_in: $tokenIds }) {
          address: id
          derivedNativeCurrency
        }
      }
    `,
    { variables: { tokenIds } }
  )

  return useMemo(() => {
    if (loading || loadingKpiTokens) return { loading: true, pricedTokenAmounts: [] }
    if (
      !tokenAmounts ||
      tokenAmounts.length === 0 ||
      !data ||
      !chainId ||
      error ||
      !kpiTokens ||
      kpiTokens.length === 0
    )
      return { loading: false, pricedTokenAmounts: [] }
    const pricedTokenAmounts = []
    for (const rewardTokenAmount of tokenAmounts) {
      const kpiToken = kpiTokens.find(
        kpiToken => kpiToken.address.toLowerCase() === rewardTokenAmount.token.address.toLowerCase()
      )
      const priceData = data.tokens.find(
        lpToken => lpToken.address.toLowerCase() === rewardTokenAmount.token.address.toLowerCase()
      )
      let price = null
      if (priceData) {
        price = new Price(
          rewardTokenAmount.token,
          nativeCurrency,
          parseUnits('1', nativeCurrency.decimals).toString(),
          parseUnits(
            new Decimal(priceData.derivedNativeCurrency).toFixed(nativeCurrency.decimals),
            nativeCurrency.decimals
          ).toString()
        )
      }
      if (!price && !!kpiToken) {
        // the reward token is a kpi token, we need to price it by looking at the collateral
        const collateralTokenNativeCurrency = kpiToken.collateral.nativeCurrencyAmount
        const kpiTokenPrice = collateralTokenNativeCurrency.divide(kpiToken.totalSupply)
        price = new Price(
          rewardTokenAmount.token,
          nativeCurrency,
          parseUnits('1', nativeCurrency.decimals).toString(),
          parseUnits(kpiTokenPrice.toFixed(nativeCurrency.decimals), nativeCurrency.decimals).toString()
        )
      }
      if (!price) continue
      pricedTokenAmounts.push(
        new PricedTokenAmount(
          new PricedToken(
            chainId,
            rewardTokenAmount.token.address,
            rewardTokenAmount.token.decimals,
            price,
            rewardTokenAmount.token.symbol,
            rewardTokenAmount.token.name
          ),
          rewardTokenAmount.raw
        )
      )
    }
    return {
      loading: false,
      pricedTokenAmounts: pricedTokenAmounts
    }
  }, [chainId, data, error, kpiTokens, loading, loadingKpiTokens, nativeCurrency, tokenAmounts])
}
