import type { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useCallback } from 'react'
import { Flex, Text } from 'ui/src'
import { spacing } from 'ui/src/theme/spacing'
import {
  AmountInputPresets,
  PRESET_BUTTON_PROPS,
} from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/AmountInputPresets'
import { PresetAmountButton } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/PresetAmountButton'
import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import { PRESET_PERCENTAGES } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/utils'
import { DefaultTokenOptions } from 'uniswap/src/components/CurrencyInputPanel/DefaultTokenOptions/DefaultTokenOptions'
import { TokenRate } from 'uniswap/src/components/CurrencyInputPanel/TokenRate'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isExtensionApp, isWebAppDesktop, isWebPlatform } from 'utilities/src/platform'

interface CurrencyInputPanelHeaderProps {
  headerLabel?: string
  currencyField: CurrencyField
  currencyBalance: Maybe<CurrencyAmount<Currency>>
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  currencyInfo: Maybe<CurrencyInfo>
  onSetPresetValue: (amount: string, percentage: PresetPercentage) => void
  showDefaultTokenOptions: boolean
}

export function CurrencyInputPanelHeader({
  headerLabel,
  currencyField,
  currencyBalance,
  currencyAmount,
  currencyInfo,
  onSetPresetValue,
  showDefaultTokenOptions,
}: CurrencyInputPanelHeaderProps): JSX.Element | null {
  const priceUXEnabled = usePriceUXEnabled()

  const isOutput = currencyField === CurrencyField.OUTPUT
  const showFlippableRate = priceUXEnabled && isOutput && !!currencyInfo

  const renderPreset = useCallback(
    (preset: PresetPercentage) => (
      <PresetAmountButton
        percentage={preset}
        currencyAmount={currencyAmount}
        currencyBalance={currencyBalance}
        currencyField={currencyField}
        elementName={ElementName.PresetPercentage}
        buttonProps={PRESET_BUTTON_PROPS}
        onSetPresetValue={onSetPresetValue}
      />
    ),
    [currencyAmount, currencyBalance, currencyField, onSetPresetValue],
  )

  if (!headerLabel && !showDefaultTokenOptions) {
    return null
  }

  const showInputPresets =
    (isWebAppDesktop || isExtensionApp) && currencyField === CurrencyField.INPUT && currencyBalance

  return (
    <Flex row justifyContent="space-between">
      {/* IMPORTANT: $micro crashes on mobile */}
      <Text color="$neutral2" variant="subheading2" fontSize={isWebPlatform ? '$micro' : '$small'}>
        {headerLabel}
      </Text>
      {showInputPresets && (
        <Flex position="absolute" right={0} top={-spacing.spacing2}>
          <AmountInputPresets presets={PRESET_PERCENTAGES} renderPreset={renderPreset} />
        </Flex>
      )}
      {showDefaultTokenOptions && isWebAppDesktop && (
        <Flex position="absolute" right={0} top={-spacing.spacing6}>
          <DefaultTokenOptions currencyField={CurrencyField.OUTPUT} />
        </Flex>
      )}
      {showFlippableRate && isWebAppDesktop && <TokenRate />}
    </Flex>
  )
}
