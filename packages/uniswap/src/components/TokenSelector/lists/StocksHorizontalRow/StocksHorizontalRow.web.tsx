import { SharedEventName } from '@uniswap/analytics-events'
import { memo } from 'react'
import type { RwaTokenOption } from 'uniswap/src/components/lists/items/types'
import { ExpandableTokenTileRow } from 'uniswap/src/components/TokenSelector/lists/ExpandableTokenTileRow.web'
import { StocksHorizontalRowProps } from 'uniswap/src/components/TokenSelector/lists/StocksHorizontalRow/StocksHorizontalRow'
import { StockTile } from 'uniswap/src/components/TokenSelector/lists/StocksHorizontalRow/StockTile'
import {
  getStockKey,
  useStocksSelectionWithWarning,
} from 'uniswap/src/components/TokenSelector/lists/StocksHorizontalRow/useStocksSelectionWithWarning'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useEvent } from 'utilities/src/react/hooks'

export const StocksHorizontalRow = memo(function StocksHorizontalRow({
  tokens,
  onSelectRwaToken,
  showTokenWarnings,
  expanded,
  onExpand,
}: StocksHorizontalRowProps): JSX.Element {
  const { onPressStock, pendingTokenKey, warningModal } = useStocksSelectionWithWarning({
    tokens,
    onSelectRwaToken,
    showTokenWarnings,
  })

  // Logged here rather than in ExpandableTokenTileRow: that row is shared with HorizontalTokenList, so an
  // event fired inside it would attribute other sections' expands to the stocks shelf.
  const onExpandRow = useEvent((expandedTokens: RwaTokenOption[]): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.TokenSelectorStocksShelfExpand,
    })
    onExpand?.(expandedTokens)
  })

  return (
    <>
      <ExpandableTokenTileRow
        tokens={tokens}
        expanded={expanded}
        keyExtractor={getStockKey}
        renderTile={(token) => (
          <StockTile option={token} isPending={pendingTokenKey === getStockKey(token)} onPressRwaToken={onPressStock} />
        )}
        onExpand={onExpandRow}
      />
      {warningModal}
    </>
  )
})
