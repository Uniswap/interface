import ms from 'ms'
import { useConvertWebQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { mapFiatCurrencyToServerCurrency } from 'uniswap/src/features/fiatCurrency/conversion'
import { getFetchPolicyForKey } from 'utils/getFetchPolicyForKey'

// TODO(WALL-4578): converge conversion rate code to use the shared localization context
export function useLocalCurrencyConversionRate(localCurrency: FiatCurrency, skip?: boolean) {
  const { data, loading } = useConvertWebQuery({
    variables: { toCurrency: mapFiatCurrencyToServerCurrency[localCurrency] },
    fetchPolicy: getFetchPolicyForKey(`convert-${localCurrency}`, ms('5m')),
    skip,
  })

  return {
    data: data?.convert?.value,
    isLoading: loading,
  }
}
