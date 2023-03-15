import WarningNote from 'components/WarningNote'
import { checkRangeSlippage } from 'utils/slippage'

type Props = {
  rawSlippage: number
  isStablePairSwap: boolean
  className?: string
}
const SlippageWarningNote: React.FC<Props> = ({ className, rawSlippage, isStablePairSwap }) => {
  const { isValid, message } = checkRangeSlippage(rawSlippage, isStablePairSwap)
  if (!isValid || !message) {
    return null
  }

  return <WarningNote className={className} shortText={message} />
}

export default SlippageWarningNote
