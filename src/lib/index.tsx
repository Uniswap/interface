import Swap from './components/Swap'
import Widget, { WidgetProps } from './components/Widget'

export type SwapWidgetProps = WidgetProps<typeof Swap>

export function SwapWidget({ ...props }: SwapWidgetProps) {
  return (
    <Widget {...props}>
      <Swap {...props} />
    </Widget>
  )
}
