import { Percent } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { formatPriceDifference } from 'uniswap/src/features/transactions/swap/utils/formatPriceDifference'
import { getPriceDifference } from 'uniswap/src/features/transactions/swap/utils/getPriceDifference'

export function usePriceDifference({ derivedSwapInfo }: { derivedSwapInfo: DerivedSwapInfo }): {
  priceDifference: Percent | undefined
  formattedPriceDifference: string | undefined
} {
  const { formatPercent } = useLocalizationContext()

  return useMemo(() => {
    const priceDifference = getPriceDifference(derivedSwapInfo)

    if (!priceDifference) {
      return { priceDifference: undefined, formattedPriceDifference: undefined }
    }

    const formattedPriceDifference = formatPriceDifference(priceDifference, formatPercent)

    return { priceDifference, formattedPriceDifference }
  }, [derivedSwapInfo, formatPercent])
}
