import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ComponentProps, useMemo } from 'react'
import { Trans } from 'react-i18next'
import { Text } from 'ui/src'
import { Warning, WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { getChainLabel, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getChainGasToken } from 'uniswap/src/features/gas/hooks/useChainGasToken'
import {
  convertShiftedGasFeeForDisplay,
  getGasFeeDecimalsShift,
  hasShiftedGasToken,
} from 'uniswap/src/features/gas/shiftedGasToken'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useCurrencyInfo, useNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { INSUFFICIENT_NATIVE_TOKEN_TEXT_VARIANT } from 'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/constants'
import { InsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/InsufficientNativeTokenWarning'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { useNetworkColors } from 'uniswap/src/utils/colors'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'

/**
 * Shows a warning when the user doesn't have enough funds to cover the transaction's network cost.
 *
 * Note: a general `InsufficientFunds` warning (input amount exceeds balance) is intentionally not
 * surfaced here — the gas-themed copy in this banner/modal is misleading when the user simply
 * doesn't have enough of the token they're swapping. That case is handled by the generic
 * insufficient-balance warning on the form / CTA instead.
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

  const warning = warnings.find((w) => w.type === WarningLabel.InsufficientGasFunds)

  const shouldShowWarning = warning?.type === WarningLabel.InsufficientGasFunds

  const nativeCurrency = warning?.currency
  const chainId = nativeCurrency?.chainId ?? defaultChainId

  const gasToken = getChainGasToken(chainId)

  const defaultNativeCurrencyInfo = useNativeCurrencyInfo(chainId)
  // On chains where gas is paid in a non-native token (e.g. pathUSD on Tempo), use its currency info
  const gasTokenCurrencyId = gasToken.isToken ? buildCurrencyId(chainId, gasToken.address) : undefined
  const gasTokenInfo = useCurrencyInfo(gasTokenCurrencyId)
  const nativeCurrencyInfo = gasTokenInfo ?? defaultNativeCurrencyInfo

  const networkColors = useNetworkColors(chainId)

  const gasAmount = useMemo(() => {
    if (!gasFee.value || !nativeCurrency?.chainId) {
      return undefined
    }
    // On chains that pay gas in a non-native shifted token (e.g. Tempo pathUSD, Arc
    // USDC): use warning.currency directly (the gas token, set upstream) and convert
    // the 18-decimal native gas fee to the gas token's decimals.
    const shiftGasToken = hasShiftedGasToken(nativeCurrency.chainId)
    const currency = shiftGasToken ? nativeCurrency : nativeOnChain(nativeCurrency.chainId)
    const value = shiftGasToken
      ? convertShiftedGasFeeForDisplay(gasFee.value, getGasFeeDecimalsShift(nativeCurrency.chainId))
      : gasFee.value
    return getCurrencyAmount({ value, valueType: ValueType.Raw, currency })
  }, [gasFee.value, nativeCurrency])

  const gasAmountUsd = useUSDCValue(gasAmount)

  const gasAmountFiatFormatted = convertFiatAmountFormatted(gasAmountUsd?.toExact(), NumberType.FiatGasPrice)

  if (!shouldShowWarning || !nativeCurrency || !nativeCurrencyInfo) {
    return null
  }

  if (!gasAmount) {
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
      tokenAmount: gasAmount.toSignificant(2),
    }

    if (isTestnetModeEnabled) {
      return (
        <Trans
          components={warningComponents}
          i18nKey="transaction.warning.insufficientGas.modal.message.noAction"
          values={warningValues}
        />
      )
    }
    return (
      <Trans
        components={warningComponents}
        i18nKey="transaction.warning.insufficientGas.modal.message"
        values={warningValues}
      />
    )
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
