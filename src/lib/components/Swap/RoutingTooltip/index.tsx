import { Currency, TradeType } from '@uniswap/sdk-core'
import Tooltip from 'lib/components/Tooltip'
import { Info } from 'lib/icons'
import { useMemo } from 'react'
import { InterfaceTrade } from 'state/routing/types'

import { getTokenPath, RoutingDiagramEntry } from './utils'

export default function RoutingTooltip({ trade }: { trade: InterfaceTrade<Currency, Currency, TradeType> }) {
  const routes: RoutingDiagramEntry[] = useMemo(() => getTokenPath(trade), [trade])

  return (
    <Tooltip icon={Info} placement="bottom">
      <div>hey</div>
    </Tooltip>
  )
}
