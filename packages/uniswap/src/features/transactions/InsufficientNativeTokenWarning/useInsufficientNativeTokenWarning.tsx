import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ComponentProps, useMemo } from 'react'
import { Trans } from 'react-i18next'
import { Text } from 'ui/src'
import { Warning, WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { InsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/InsufficientNativeTokenWarning'
import { INSUFFICIENT_NATIVE_TOKEN_TEXT_VARIANT } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/constants'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { useNetworkColors } from 'uniswap/src/utils/colors'
import { NumberType } from 'utilities/src/format/types'

export function useInsufficientNativeTokenWarning({
  flow,
  gasFee,
  warnings,
}: ComponentProps<typeof InsufficientNativeTokenWarning>): {
  gasAmount: CurrencyAmount<NativeCurrency> | null | undefined
  gasAmountFiatFormatted: string
  nativeCurrency: Currency
  nativeCurrencyInfo: CurrencyInfo
  networkColors: ReturnType<typeof useNetworkColors>
  networkName: string
  modalOrTooltipMainMessage: JSX.Element
  warning: Warning
  flow: ComponentProps<typeof InsufficientNativeTokenWarning>['flow']
} | null {
  const { defaultChainId } = useEnabledChains()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const warning = warnings.find((w) => w.type === WarningLabel.InsufficientGasFunds)
  const nativeCurrency = warning?.currency
  const chainId = nativeCurrency?.chainId ?? defaultChainId

  const nativeCurrencyInfo = useNativeCurrencyInfo(chainId)

  const networkColors = useNetworkColors(chainId)

  const gasAmount = useMemo(
    () =>
      getCurrencyAmount({
        value: gasFee.value,
        valueType: ValueType.Raw,
        currency: nativeCurrency?.chainId ? NativeCurrency.onChain(nativeCurrency.chainId) : undefined,
      }),
    [gasFee.value, nativeCurrency?.chainId],
  )

  const gasAmountUsd = useUSDCValue(gasAmount)

  const gasAmountFiatFormatted = convertFiatAmountFormatted(gasAmountUsd?.toExact(), NumberType.FiatGasPrice)

  if (!warning || !nativeCurrency || !nativeCurrencyInfo) {
    return null
  }

  const supportedChainId = toSupportedChainId(nativeCurrency?.chainId)

  if (!supportedChainId) {
    throw new Error(`Unsupported chain ID: ${nativeCurrency?.chainId}`)
  }

  const networkName = UNIVERSE_CHAIN_INFO[supportedChainId].label

  const modalOrTooltipMainMessage = (
    <Trans
      components={{
        // TODO(EXT-1269): move this to `value` once the bug in i18next is fixed.
        // We need to pass this as a `component` instead of a `value` because there seems to be a bug in i18next
        // which causes the value `<$0.01` to be incorrectly escaped.
        fiatTokenAmount: (
          <Text color="$neutral2" variant={INSUFFICIENT_NATIVE_TOKEN_TEXT_VARIANT}>
            {gasAmountFiatFormatted}
          </Text>
        ),
      }}
      i18nKey="transaction.warning.insufficientGas.modal.message"
      values={{
        networkName,
        tokenSymbol: nativeCurrency?.symbol,
        tokenAmount: gasAmount?.toSignificant(2),
      }}
    />
  )

  return {
    flow,
    gasAmount,
    gasAmountFiatFormatted,
    nativeCurrency,
    nativeCurrencyInfo,
    networkColors,
    networkName,
    modalOrTooltipMainMessage,
    warning,
  }
}
