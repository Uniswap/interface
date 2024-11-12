import { TouchableArea, TouchableAreaProps } from 'ui/src'
import { Warning } from 'uniswap/src/components/modals/WarningModal/types'

type TradeWarningRowProps = React.PropsWithChildren<TouchableAreaProps> & { warning: Warning }

export function TradeWarningRow(props: TradeWarningRowProps): JSX.Element {
  if (!props.warning.message) {
    return <>{props.children}</>
  }

  return <TouchableArea {...props} />
}
