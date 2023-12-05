import { SupportedLocalCurrency } from 'constants/localCurrencies'
import gql from 'graphql-tag'
import ms from 'ms'
import { getFetchPolicyForKey } from 'utils/getFetchPolicyForKey'

import { useConvertQuery } from './__generated__/types-and-hooks'

gql`
  query Convert($toCurrency: Currency!) {
    convert(fromAmount: { currency: USD, value: 1.0 }, toCurrency: $toCurrency) {
      id
      value
      currency
    }
  }
`

export function useLocalCurrencyConversionRate(localCurrency: SupportedLocalCurrency, skip?: boolean) {
  const { data, loading } = useConvertQuery({
    variables: { toCurrency: localCurrency },
    fetchPolicy: getFetchPolicyForKey(`convert-${localCurrency}`, ms('5m')),
    skip,
  })

  return {
    data: data?.convert?.value,
    isLoading: loading,
  }
}
