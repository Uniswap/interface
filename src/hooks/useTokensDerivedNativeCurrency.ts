import { gql, useQuery } from '@apollo/client'
import Decimal from 'decimal.js-light'
import { Price, PricedToken, PricedTokenAmount, Token, TokenAmount } from '@swapr/sdk'
import { parseUnits } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'
import { useNativeCurrency } from './useNativeCurrency'

export function useNativeCurrencyPricedTokenAmounts(
  tokenAmounts?: TokenAmount[] | null
): { loading: boolean; pricedTokenAmounts: PricedTokenAmount[] } {
  const { chainId } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()

  interface QueryResult {
    tokens: [{ address: string; name: string; symbol: string; decimals: string; derivedNativeCurrency: string }]
  }

  const { loading, data, error } = useQuery<QueryResult>(
    gql`
      query getTokensDerivedNativeCurrency($tokenIds: [ID!]!) {
        tokens(where: { id_in: $tokenIds }) {
          address: id
          derivedNativeCurrency
        }
      }
    `,
    { variables: { tokenIds: tokenAmounts?.map(tokenAmount => tokenAmount.token.address.toLowerCase()) } }
  )

  return useMemo(() => {
    if (loading) return { loading: true, pricedTokenAmounts: [] }
    if (!tokenAmounts || !data || !chainId || error) return { loading: false, pricedTokenAmounts: [] }
    const pricedTokenAmounts = []
    for (const rawTokenData of data.tokens) {
      const relatedTokenAmount = tokenAmounts.find(
        tokenAmount => tokenAmount.token.address.toLowerCase() === rawTokenData.address
      )
      if (!relatedTokenAmount) {
        continue
      }
      const { address, symbol, name, decimals } = relatedTokenAmount.token
      const properRewardToken = new Token(chainId, address, decimals, symbol, name)
      const rewardTokenPriceNativeCurrency = new Price(
        properRewardToken,
        nativeCurrency,
        parseUnits('1', nativeCurrency.decimals).toString(),
        parseUnits(
          new Decimal(rawTokenData.derivedNativeCurrency).toFixed(nativeCurrency.decimals),
          nativeCurrency.decimals
        ).toString()
      )
      pricedTokenAmounts.push(
        new PricedTokenAmount(
          new PricedToken(chainId, address, decimals, rewardTokenPriceNativeCurrency, symbol, name),
          relatedTokenAmount.raw
        )
      )
    }
    return {
      loading: false,
      pricedTokenAmounts: pricedTokenAmounts
    }
  }, [chainId, data, error, loading, nativeCurrency, tokenAmounts])
}
