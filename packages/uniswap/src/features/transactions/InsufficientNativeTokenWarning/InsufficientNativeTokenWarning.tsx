import { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { InsufficientNativeTokenWarningContent } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/InsufficientNativeTokenWarningContent'
import { useInsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/useInsufficientNativeTokenWarning'
import { logger } from 'utilities/src/logger/logger'

export function InsufficientNativeTokenWarning({
  warnings,
  flow,
  gasFee,
}: {
  warnings: Warning[]
  flow: 'send' | 'swap'
  gasFee: GasFeeResult
}): JSX.Element | null {
  const parsedInsufficentNativeTokenWarning = useInsufficientNativeTokenWarning({
    warnings,
    flow,
    gasFee,
  })

  const { nativeCurrency, nativeCurrencyInfo } = parsedInsufficentNativeTokenWarning ?? {}

  const address = useAccountMeta()?.address

  if (!parsedInsufficentNativeTokenWarning || !nativeCurrencyInfo || !nativeCurrency) {
    return null
  }

  if (!address) {
    logger.error(new Error('Unexpected render of `InsufficientNativeTokenWarning` without an active address'), {
      tags: {
        file: 'InsufficientNativeTokenWarning.tsx',
        function: 'InsufficientNativeTokenWarning',
      },
    })
    return null
  }

  return (
    <InsufficientNativeTokenWarningContent
      address={address}
      parsedInsufficentNativeTokenWarning={parsedInsufficentNativeTokenWarning}
      nativeCurrencyInfo={nativeCurrencyInfo}
      nativeCurrency={nativeCurrency}
    />
  )
}
