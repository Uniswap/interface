import Swap, { SwapProps } from './components/Swap'
import Widget from './components/Widget'

export function SwapWidget({ ...props }: SwapProps) {
  return (
    <Widget {...props}>
      <Swap {...props} />
    </Widget>
  )
}
