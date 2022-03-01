/**
 * The entry point for @uniswap/widgets.
 * Any exports *must* be mirrored in ../widgets.mjs in order to be included in the ES module.
 */

import Swap, { SwapProps } from './components/Swap'
import Widget, { WidgetProps } from './components/Widget'
export { SUPPORTED_LOCALES } from 'constants/locales'

type SwapWidgetProps = SwapProps & WidgetProps

export function SwapWidget(props: SwapWidgetProps) {
  return (
    <Widget {...props}>
      <Swap {...props} />
    </Widget>
  )
}
