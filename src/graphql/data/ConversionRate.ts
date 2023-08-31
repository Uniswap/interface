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

export function useLocalCurrencyConversionRate(localCurrency: SupportedLocalCurrency): number | undefined {
  const { data } = useConvertQuery({
    variables: { toCurrency: localCurrency },
    fetchPolicy: getFetchPolicyForKey(`convert-${localCurrency}`, ms('5m')),
  })

  return data?.convert?.value
}
