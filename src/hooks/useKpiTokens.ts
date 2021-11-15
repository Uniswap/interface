import { gql, useQuery } from '@apollo/client'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'
import { PricedTokenAmount, Price, Token, PricedToken, KpiToken } from '@swapr/sdk'
import { SubgraphKpiToken } from '../apollo'
import { getAddress } from '@ethersproject/address'
import { useNativeCurrency } from '../hooks/useNativeCurrency'
import { parseUnits } from '@ethersproject/units'
import { Decimal } from 'decimal.js-light'
import { useCarrotSubgraphClient } from './useCarrotSubgraphClient'

const KPI_TOKENS_QUERY = gql`
  query kpiTokens($ids: [ID!]!) {
    kpiTokens(where: { id_in: $ids }) {
      address: id
      symbol
      name
      totalSupply
      collateral {
        token {
          address: id
          symbol
          name
          decimals
        }
        amount
      }
    }
  }
`

interface KpiTokensQueryResult {
  kpiTokens: SubgraphKpiToken[]
}

const DERIVED_NATIVE_CURRENCY_QUERY = gql`
  query getTokensDerivedNativeCurrency($tokenIds: [ID!]!) {
    tokens(where: { id_in: $tokenIds }) {
      address: id
      derivedNativeCurrency
    }
  }
`

interface DerivedNativeCurrencyQueryResult {
  tokens: [{ address: string; name: string; symbol: string; decimals: string; derivedNativeCurrency: string }]
}

export const useKpiTokens = (addresses: string[]): { loading: boolean; kpiTokens: KpiToken[] } => {
  const { chainId } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
  const carrotSubgraphClient = useCarrotSubgraphClient()

  const lowercaseAddresses = useMemo(() => addresses.map(address => address.toLowerCase()), [addresses])
  const { loading: loadingRawKpiTokens, data: rawKpiTokens, error: rawKpiTokensError } = useQuery<KpiTokensQueryResult>(
    KPI_TOKENS_QUERY,
    { variables: { ids: lowercaseAddresses }, client: carrotSubgraphClient }
  )
  const collateralTokenAddresses = useMemo(() => {
    if (loadingRawKpiTokens || rawKpiTokensError || !rawKpiTokens) return []
    return rawKpiTokens.kpiTokens.map(rawKpiToken => rawKpiToken.collateral.token.address.toLowerCase())
  }, [loadingRawKpiTokens, rawKpiTokens, rawKpiTokensError])
  const { loading: loadingCollateralPrices, data: collateralPrices, error: collateralError } = useQuery<
    DerivedNativeCurrencyQueryResult
  >(DERIVED_NATIVE_CURRENCY_QUERY, {
    variables: { tokenIds: collateralTokenAddresses }
  })

  return useMemo(() => {
    if (!chainId || loadingRawKpiTokens || loadingCollateralPrices) return { loading: true, kpiTokens: [] }
    if (rawKpiTokensError || collateralError || !rawKpiTokens || !collateralPrices)
      return { loading: false, kpiTokens: [] }
    return {
      loading: false,
      kpiTokens: rawKpiTokens.kpiTokens.map(rawKpiToken => {
        const collateralToken = new Token(
          chainId,
          getAddress(rawKpiToken.collateral.token.address),
          parseInt(rawKpiToken.collateral.token.decimals),
          rawKpiToken.collateral.token.symbol,
          rawKpiToken.collateral.token.name
        )
        const collateralPrice = collateralPrices.tokens.find(
          token => token.address.toLowerCase() === rawKpiToken.collateral.token.address.toLowerCase()
        )
        const collateralTokenPrice = new Price(
          collateralToken,
          nativeCurrency,
          parseUnits('1', nativeCurrency.decimals).toString(),
          parseUnits(
            collateralPrice ? new Decimal(collateralPrice.derivedNativeCurrency).toFixed(nativeCurrency.decimals) : '0',
            nativeCurrency.decimals
          ).toString()
        )
        const pricedCollateral = new PricedToken(
          chainId,
          collateralToken.address,
          collateralToken.decimals,
          collateralTokenPrice,
          collateralToken.symbol,
          collateralToken.name
        )
        const collateralTokenAmount = new PricedTokenAmount(pricedCollateral, rawKpiToken.collateral.amount)
        const kpiToken = new KpiToken(
          chainId,
          getAddress(rawKpiToken.address),
          rawKpiToken.totalSupply,
          collateralTokenAmount,
          rawKpiToken.symbol,
          rawKpiToken.name
        )
        return kpiToken
      })
    }
  }, [
    chainId,
    collateralError,
    collateralPrices,
    loadingCollateralPrices,
    loadingRawKpiTokens,
    nativeCurrency,
    rawKpiTokens,
    rawKpiTokensError
  ])
}
