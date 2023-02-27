import { Pair } from '@kyberswap/ks-sdk-classic'
import { Currency } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { PairState, usePair } from 'data/Reserves'

import { Field } from './actions'

export function useDerivedPairInfo(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
): {
  currencies: { [field in Field]?: Currency }
  pairs: [PairState, Pair | null, boolean?][]
} {
  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA ?? undefined,
      [Field.CURRENCY_B]: currencyB ?? undefined,
    }),
    [currencyA, currencyB],
  )
  const pairs = usePair(currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B])
  return {
    currencies,
    pairs,
  }
}
