import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Flex, Text, isWeb } from 'ui/src'
import { spacing } from 'ui/src/theme/spacing'
import { AmountInputPresets } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/AmountInputPresets'
import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import { TokenRate } from 'uniswap/src/components/CurrencyInputPanel/TokenRate'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { Experiments, Layers, SwapPresetsProperties } from 'uniswap/src/features/gating/experiments'
import { useExperimentValueFromLayer } from 'uniswap/src/features/gating/hooks'
import { DefaultTokenOptions } from 'uniswap/src/features/transactions/swap/form/body/DefaultTokenOptions/DefaultTokenOptions'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isInterfaceDesktop } from 'utilities/src/platform'

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
  const isInputPresetsEnabled = useExperimentValueFromLayer<Layers.SwapPage, Experiments.SwapPresets, boolean>(
    Layers.SwapPage,
    SwapPresetsProperties.InputEnabled,
    false,
  )

  const isOutput = currencyField === CurrencyField.OUTPUT
  const showFlippableRate = priceUXEnabled && isOutput && !!currencyInfo

  if (!headerLabel && !showDefaultTokenOptions) {
    return null
  }

  const showInputPresets =
    isInputPresetsEnabled && isInterfaceDesktop && currencyField === CurrencyField.INPUT && currencyBalance

  return (
    <Flex row justifyContent="space-between">
      {/* IMPORTANT: $micro crashes on mobile */}
      <Text color="$neutral2" variant="subheading2" fontSize={isWeb ? '$micro' : '$small'}>
        {headerLabel}
      </Text>
      {showInputPresets && (
        <Flex position="absolute" right={0} top={-spacing.spacing2}>
          <AmountInputPresets
            currencyAmount={currencyAmount}
            currencyBalance={currencyBalance}
            buttonProps={{ py: '$spacing4' }}
            onSetPresetValue={onSetPresetValue}
          />
        </Flex>
      )}
      {showDefaultTokenOptions && isInterfaceDesktop && (
        <Flex position="absolute" right={0} top={-spacing.spacing4}>
          <DefaultTokenOptions currencyField={CurrencyField.OUTPUT} />
        </Flex>
      )}
      {showFlippableRate && isInterfaceDesktop && <TokenRate />}
    </Flex>
  )
}
