import { memo } from 'react'
import { HorizontalPillRow } from 'uniswap/src/components/TokenSelector/lists/HorizontalPillRow.native'
import { StockPill } from 'uniswap/src/components/TokenSelector/lists/StocksHorizontalRow/StockPill'
import { StocksHorizontalRowProps } from 'uniswap/src/components/TokenSelector/lists/StocksHorizontalRow/StocksHorizontalRow'
import {
  getStockKey,
  useStocksSelectionWithWarning,
} from 'uniswap/src/components/TokenSelector/lists/StocksHorizontalRow/useStocksSelectionWithWarning'

export const StocksHorizontalRow = memo(function StocksHorizontalRow({
  tokens,
  onSelectRwaToken,
  showTokenWarnings,
}: StocksHorizontalRowProps): JSX.Element {
  const { onPressStock, pendingTokenKey, warningModal } = useStocksSelectionWithWarning({
    tokens,
    onSelectRwaToken,
    showTokenWarnings,
  })

  return (
    <>
      <HorizontalPillRow
        data={tokens}
        extraData={pendingTokenKey}
        keyExtractor={getStockKey}
        renderPill={(token) => (
          <StockPill option={token} isPending={pendingTokenKey === getStockKey(token)} onPressRwaToken={onPressStock} />
        )}
      />
      {warningModal}
    </>
  )
})
