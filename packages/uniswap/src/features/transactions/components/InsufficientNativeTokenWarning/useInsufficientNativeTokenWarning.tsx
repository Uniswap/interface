import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ComponentProps, useMemo } from 'react'
import { Trans } from 'react-i18next'
import { Text } from 'ui/src'
import { Warning, WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { getChainLabel, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { INSUFFICIENT_NATIVE_TOKEN_TEXT_VARIANT } from 'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/constants'
import { InsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/InsufficientNativeTokenWarning'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { useNetworkColors } from 'uniswap/src/utils/colors'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'

/**
 * Shows a warning in 2 different cases:
 * 1. When the user doesn't have enough funds to cover the transaction's network cost.
 * 2. When the user is trying to swap a native token and they don't have enough of that token.
 */
export function useInsufficientNativeTokenWarning({
  flow,
  gasFee,
  warnings,
}: ComponentProps<typeof InsufficientNativeTokenWarning>): {
  gasAmount: CurrencyAmount<Currency> | null | undefined
  gasAmountFiatFormatted: string
  nativeCurrency: Currency
  nativeCurrencyInfo: CurrencyInfo
  networkColors: ReturnType<typeof useNetworkColors>
  networkName: string
  modalOrTooltipMainMessage: JSX.Element
  warning: Warning
  flow: ComponentProps<typeof InsufficientNativeTokenWarning>['flow']
} | null {
  const { defaultChainId, isTestnetModeEnabled } = useEnabledChains()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const insufficientGasFundsWarning = warnings.find((w) => w.type === WarningLabel.InsufficientGasFunds)

  const insufficientFundsWarning: Warning | undefined =
    flow === 'swap' ? warnings.find((w) => w.type === WarningLabel.InsufficientFunds) : undefined

  const warning = insufficientGasFundsWarning ?? insufficientFundsWarning

  const shouldShowWarning =
    warning?.type === WarningLabel.InsufficientGasFunds ||
    (warning?.type === WarningLabel.InsufficientFunds && warning.currency?.isNative)

  const nativeCurrency = warning?.currency
  const chainId = nativeCurrency?.chainId ?? defaultChainId

  const nativeCurrencyInfo = useNativeCurrencyInfo(chainId)

  const networkColors = useNetworkColors(chainId)

  const gasAmount = useMemo(
    () =>
      getCurrencyAmount({
        value: gasFee.value,
        valueType: ValueType.Raw,
        currency: nativeCurrency?.chainId ? nativeOnChain(nativeCurrency.chainId) : undefined,
      }),
    [gasFee.value, nativeCurrency?.chainId],
  )

  const gasAmountUsd = useUSDCValue(gasAmount)

  const gasAmountFiatFormatted = convertFiatAmountFormatted(gasAmountUsd?.toExact(), NumberType.FiatGasPrice)

  if (!shouldShowWarning || !nativeCurrency || !nativeCurrencyInfo) {
    return null
  }

  if (warning.type === WarningLabel.InsufficientGasFunds && !gasAmount) {
    logger.warn(
      'useInsufficientNativeTokenWarning',
      'useInsufficientNativeTokenWarning',
      'No `gasAmount` found when trying to render `InsufficientNativeTokenWarning`',
      {
        warning,
        gasFee,
        nativeCurrency,
        nativeCurrencyInfo,
      },
    )
    return null
  }

  const supportedChainId = toSupportedChainId(nativeCurrency.chainId)

  if (!supportedChainId) {
    throw new Error(`Unsupported chain ID: ${nativeCurrency.chainId}`)
  }

  const networkName = getChainLabel(supportedChainId)

  const getModalOrTooltipMainMessage = (): JSX.Element => {
    // When the user doesn't have enough funds to cover the transaction's network cost.
    const warningComponents = {
      // TODO(WALL-3901): move this to `value` once the bug in i18next is fixed.
      // We need to pass this as a `component` instead of a `value` because there seems to be a bug in i18next
      // which causes the value `<$0.01` to be incorrectly escaped.
      fiatTokenAmount: (
        <Text color="$neutral2" variant={INSUFFICIENT_NATIVE_TOKEN_TEXT_VARIANT}>
          {gasAmountFiatFormatted}
        </Text>
      ),
    }

    const warningValues = {
      networkName,
      tokenSymbol: nativeCurrency.symbol,
      tokenAmount: gasAmount ? gasAmount.toSignificant(2) : '',
    }

    if (warning.type === WarningLabel.InsufficientGasFunds) {
      if (isTestnetModeEnabled) {
        return (
          <Trans
            components={warningComponents}
            i18nKey="transaction.warning.insufficientGas.modal.message.noAction"
            values={warningValues}
          />
        )
      } else {
        return (
          <Trans
            components={warningComponents}
            i18nKey="transaction.warning.insufficientGas.modal.message"
            values={warningValues}
          />
        )
      }
    } else {
      // When the user is trying to swap a native token and they don't have enough of that token.
      const values = {
        networkName,
        tokenSymbol: nativeCurrency.symbol,
      }

      if (isTestnetModeEnabled) {
        return (
          <Trans
            i18nKey="transaction.warning.insufficientGas.modal.messageSwapWithoutTokenAmount.noAction"
            values={values}
          />
        )
      } else {
        return (
          <Trans
            components={warningComponents}
            i18nKey="transaction.warning.insufficientGas.modal.messageSwapWithoutTokenAmount"
            values={warningValues}
          />
        )
      }
    }
  }

  return {
    flow,
    gasAmount,
    gasAmountFiatFormatted,
    nativeCurrency,
    nativeCurrencyInfo,
    networkColors,
    networkName,
    modalOrTooltipMainMessage: getModalOrTooltipMainMessage(),
    warning,
  }
}
