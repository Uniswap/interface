import { SlippageSettingValue } from '@universe/transactions-ui'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { SlippageControlProps } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/SlippageControl/types'
import { useSlippageSettings } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/useSlippageSettings'

export function SlippageControl(props: SlippageControlProps): JSX.Element {
  const { formatPercent } = useLocalizationContext()
  const { currentSlippageTolerance, autoSlippageEnabled } = useSlippageSettings({
    saveOnBlur: props.saveOnBlur,
    isZeroSlippage: props.isZeroSlippage,
  })

  return (
    <SlippageSettingValue
      slippage={{
        tolerance: formatPercent(currentSlippageTolerance),
        isCustom: !autoSlippageEnabled,
        isZero: Boolean(props.isZeroSlippage),
      }}
    />
  )
}
