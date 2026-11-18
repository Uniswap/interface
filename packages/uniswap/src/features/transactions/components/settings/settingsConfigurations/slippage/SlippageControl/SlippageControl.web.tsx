import { SlippageInlineInput, type SlippageWarningLevel } from '@universe/transactions-ui'
import type { SlippageControlProps } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/SlippageControl/types'
import { useSlippageSettings } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/useSlippageSettings'

export function SlippageControl(props: SlippageControlProps): JSX.Element {
  const {
    autoSlippageEnabled,
    inputSlippageTolerance,
    autoSlippageTolerance,
    inputAnimatedStyle,
    onPressAutoSlippage,
    onChangeSlippageInput,
    onFocusSlippageInput,
    onBlurSlippageInput,
    showSlippageWarning,
    showSlippageCritical,
  } = useSlippageSettings({
    saveOnBlur: props.saveOnBlur,
    isZeroSlippage: props.isZeroSlippage,
  })

  const inputValue = autoSlippageEnabled ? autoSlippageTolerance.toString() : inputSlippageTolerance

  // The border's comparisons. The old value text compared the shown value instead, which only
  // differs while auto is on with an auto tolerance of 20% or more.
  const warningLevel: SlippageWarningLevel | undefined = showSlippageCritical
    ? 'critical'
    : showSlippageWarning
      ? 'warning'
      : undefined

  return (
    <SlippageInlineInput
      value={inputValue}
      isAuto={autoSlippageEnabled}
      warningLevel={warningLevel}
      shakeStyle={inputAnimatedStyle}
      onChangeValue={onChangeSlippageInput}
      onPressAuto={onPressAutoSlippage}
      onFocus={onFocusSlippageInput}
      onBlur={onBlurSlippageInput}
    />
  )
}
