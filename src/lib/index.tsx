import Swap from './components/Swap'
import Widget, { WidgetProps } from './components/Widget'

type SwapWidgetProps = Omit<WidgetProps, 'children'>

export function SwapWidget(props: SwapWidgetProps) {
  return (
    <Widget {...props}>
      <Swap />
    </Widget>
  )
}
