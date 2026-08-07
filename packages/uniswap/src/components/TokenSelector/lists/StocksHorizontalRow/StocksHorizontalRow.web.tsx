import { memo } from 'react'
import { ExpandableTokenTileRow } from 'uniswap/src/components/TokenSelector/lists/ExpandableTokenTileRow.web'
import { StocksHorizontalRowProps } from 'uniswap/src/components/TokenSelector/lists/StocksHorizontalRow/StocksHorizontalRow'
import { StockTile } from 'uniswap/src/components/TokenSelector/lists/StocksHorizontalRow/StockTile'
import {
  getStockKey,
  useStocksSelectionWithWarning,
} from 'uniswap/src/components/TokenSelector/lists/StocksHorizontalRow/useStocksSelectionWithWarning'

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

  return (
    <>
      <ExpandableTokenTileRow
        tokens={tokens}
        expanded={expanded}
        keyExtractor={getStockKey}
        renderTile={(token) => (
          <StockTile option={token} isPending={pendingTokenKey === getStockKey(token)} onPressRwaToken={onPressStock} />
        )}
        onExpand={onExpand}
      />
      {warningModal}
    </>
  )
})
