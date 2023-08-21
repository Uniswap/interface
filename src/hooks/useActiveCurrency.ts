import { DEFAULT_CURRENCY, SupportedCurrency } from 'constants/currencies'
import { atomWithStorage, useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'

const activeCurrencyAtom = atomWithStorage<SupportedCurrency>('activeCurrency', DEFAULT_CURRENCY)

export function useActiveCurrency(): SupportedCurrency {
  const activeCurrency = useAtomValue(activeCurrencyAtom)

  return useMemo(() => activeCurrency, [activeCurrency])
}
