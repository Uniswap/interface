import { SharedEventName } from '@uniswap/analytics-events'
import type { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { isHoverable, isWebPlatform } from '@universe/environment'
import { TestID } from '@universe/test'
import type {
  AmountPreset,
  AmountPresetPercentage,
  CurrencyInputPanelPresets,
  CurrencyInputPanelPresetsPlacement,
} from '@universe/transactions-ui'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import {
  getPresetAmount,
  isMaxPercentage,
  isPresetAmountDisabled,
  PRESET_PERCENTAGES,
} from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/utils'
import { useMaxAmountSpend } from 'uniswap/src/features/gas/hooks/useMaxAmountSpend'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const LONE_MAX: PresetPercentage[] = ['max']

interface MaxBalanceInfo {
  isOpen: boolean
  isMax: boolean
}

/**
 * The panel's percentage presets as view data: what PresetAmountButton derived per button (the
 * amount each sets, when each is disabled, the native-balance explanation) plus its press
 * handling and the state of the native MaxBalanceInfoModal it opened.
 */
export function useCurrencyInputPanelPresets({
  placement,
  currencyField,
  currencyAmount,
  currencyBalance,
  transactionType,
  actualGasFee,
  isGasCovered,
  onSetPresetValue,
}: {
  placement: CurrencyInputPanelPresetsPlacement | undefined
  currencyField: CurrencyField
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  currencyBalance: Maybe<CurrencyAmount<Currency>>
  transactionType?: TransactionType
  actualGasFee?: string
  isGasCovered?: boolean
  onSetPresetValue?: (amount: string, percentage: PresetPercentage) => void
}): {
  presets: CurrencyInputPanelPresets | undefined
  maxBalanceInfo: MaxBalanceInfo & { onClose: () => void }
} {
  const { t } = useTranslation()
  const trace = useTrace()
  const [maxBalanceInfo, setMaxBalanceInfo] = useState<MaxBalanceInfo>({ isOpen: false, isMax: false })

  // The header presets never got the transaction type; the footer presets and the lone Max did.
  const maxInputAmount = useMaxAmountSpend({
    currencyAmount: currencyBalance,
    txType: placement === 'header' ? undefined : transactionType,
    actualGasFee,
    isGasCovered,
  })

  const isInput = currencyField === CurrencyField.INPUT
  const isNativeAsset = !!currencyBalance?.currency.isNative
  const isLoneMax = placement === 'balance'
  const element = isLoneMax
    ? isInput
      ? ElementName.SetPercentageInput
      : ElementName.SetPercentageOutput
    : ElementName.PresetPercentage

  const getAmount = (percentage: PresetPercentage): Maybe<CurrencyAmount<Currency>> =>
    getPresetAmount({
      percentage,
      currency: currencyBalance?.currency,
      rawBalanceAmount: currencyBalance?.quotient,
      maxInputAmount,
    })

  const onSelectPreset = (percentage: AmountPresetPercentage): void => {
    const amount = getAmount(percentage)
    if (amount) {
      onSetPresetValue?.(amount.toExact(), percentage)
    }
    // The event the old Trace sent for this press. Native only, like before: on web and extension
    // the ui/src Button frame kept onPress over the onClick Trace injected, so it never logged there.
    if (!isWebPlatform) {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, { ...trace, element, percentage })
    }
  }

  const onPressDisabledPreset = (percentage: AmountPresetPercentage): void => {
    if (isNativeAsset) {
      setMaxBalanceInfo({ isOpen: true, isMax: isMaxPercentage(percentage) })
    }
  }

  const onCloseMaxBalanceInfo = (): void => setMaxBalanceInfo((info) => ({ ...info, isOpen: false }))

  if (!placement) {
    return { presets: undefined, maxBalanceInfo: { ...maxBalanceInfo, onClose: onCloseMaxBalanceInfo } }
  }

  const presets: AmountPreset[] = (isLoneMax ? LONE_MAX : PRESET_PERCENTAGES).map((percentage) => {
    const disabled = isPresetAmountDisabled({ percentage, presetAmount: getAmount(percentage), currencyAmount })
    const isMax = isMaxPercentage(percentage)
    return {
      percentage,
      disabled,
      // Web shows it on hover, as MaxBalanceInfoModal's tooltip did; native opens the modal instead.
      disabledTooltip:
        isNativeAsset && disabled
          ? isMax
            ? t('transaction.networkCost.maxNativeBalance.description')
            : t('transaction.networkCost.presetNativeBalance.description')
          : undefined,
      testID: isInput ? TestID.SetMaxInput : TestID.SetMaxOutput,
    }
  })

  return {
    presets: {
      placement,
      presets,
      onSelectPreset,
      onPressDisabledPreset,
      // The lone Max never had the hover reveal.
      revealOnHover: !isLoneMax && isHoverable,
    },
    maxBalanceInfo: { ...maxBalanceInfo, onClose: onCloseMaxBalanceInfo },
  }
}
