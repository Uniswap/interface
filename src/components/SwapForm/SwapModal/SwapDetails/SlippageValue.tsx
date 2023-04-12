import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import useTheme from 'hooks/useTheme'
import { TYPE } from 'theme'
import { checkWarningSlippage, formatSlippage } from 'utils/slippage'

const SlippageValue: React.FC = () => {
  const theme = useTheme()
  const { slippage, isStablePairSwap } = useSwapFormContext()
  const isWarning = checkWarningSlippage(slippage, isStablePairSwap)

  return (
    <TYPE.black fontSize={12} color={isWarning ? theme.warning : undefined}>
      {formatSlippage(slippage)}
    </TYPE.black>
  )
}

export default SlippageValue
