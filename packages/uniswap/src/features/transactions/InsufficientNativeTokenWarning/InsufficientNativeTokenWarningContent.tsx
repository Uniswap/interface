import { Currency } from '@uniswap/sdk-core'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useInsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/useInsufficientNativeTokenWarning'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type InsufficientNativeTokenWarningContentProps = {
  address: Address
  parsedInsufficentNativeTokenWarning: NonNullable<ReturnType<typeof useInsufficientNativeTokenWarning>>
  nativeCurrencyInfo: CurrencyInfo
  nativeCurrency: Currency
}

export function InsufficientNativeTokenWarningContent(
  _: InsufficientNativeTokenWarningContentProps,
): JSX.Element | null {
  throw new PlatformSplitStubError('InsufficientNativeTokenWarningContent')
}
