import { Trans } from '@lingui/macro'
import { WrapError } from 'lib/hooks/swap/useWrapCallback'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'

export function WrapErrorText({ wrapError }: { wrapError: WrapError }) {
  const native = useNativeCurrency()
  const wrapped = native?.wrapped

  switch (wrapError) {
    case WrapError.ENTER_NATIVE_AMOUNT:
      return <Trans>Enter {native?.symbol} amount</Trans>
    case WrapError.ENTER_WRAPPED_AMOUNT:
      return <Trans>Enter {wrapped?.symbol} amount</Trans>
    case WrapError.INSUFFICIENT_NATIVE_BALANCE:
      return <Trans>Insufficient {native?.symbol} balance</Trans>
    case WrapError.INSUFFICIENT_WRAPPED_BALANCE:
      return <Trans>Insufficient {wrapped?.symbol} balance</Trans>
    case WrapError.NO_ERROR:
    default:
      return null
  }
}
