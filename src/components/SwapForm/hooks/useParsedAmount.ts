import { Currency } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { tryParseAmount } from 'state/swap/hooks'

const useParsedAmount = (currency: Currency | undefined, typedValue: string) => {
  const parsedAmount = useMemo(() => {
    return tryParseAmount(typedValue, currency)
  }, [typedValue, currency])

  return parsedAmount
}

export default useParsedAmount
