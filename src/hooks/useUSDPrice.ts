import { Currency, CurrencyAmount } from '@pollum-io/sdk-core'
import { useNewTopTokens } from 'graphql/tokens/NewTopTokens'
import { useFetchedTokenData } from 'graphql/tokens/TokenData'
import { useMemo } from 'react'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

export function useUSDPrice(currencyAmount?: CurrencyAmount<Currency>): {
  data: number | undefined
  isLoading: boolean
} {
  const currency = currencyAmount?.currency

  const { loading, tokens: newTokens } = useNewTopTokens()
  const tokensAddress = newTokens?.map((token) => token.id) || []
  const { loading: tokenDataLoading, data: tokenData } = useFetchedTokenData(tokensAddress)

  const address = useMemo(() => {
    if (currency) {
      if ('tokenInfo' in currency) {
        console.log('aqui')
        const token = currency as WrappedTokenInfo
        return token.address
      }

      if (currency.isNative === true) {
        return currency.wrapped.address
      }
    }
    return ''
  }, [currency])

  if (loading && tokenDataLoading && !tokenData) return { data: undefined, isLoading: tokenDataLoading }

  const token = tokenData?.find((token) => token.address.toLocaleLowerCase() === address.toLocaleLowerCase())
  const tokenPrice = token ? token.priceUSD : 0

  return { data: parseFloat(currencyAmount?.toExact() ?? '0') * tokenPrice, isLoading: false }
}
