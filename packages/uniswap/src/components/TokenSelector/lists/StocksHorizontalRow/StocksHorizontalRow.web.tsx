import { memo } from 'react'
import { RwaTokenOption } from 'uniswap/src/components/lists/items/types'
import { ExpandableTokenTileRow } from 'uniswap/src/components/TokenSelector/lists/ExpandableTokenTileRow.web'
import { StocksHorizontalRowProps } from 'uniswap/src/components/TokenSelector/lists/StocksHorizontalRow/StocksHorizontalRow'
import { StockTile } from 'uniswap/src/components/TokenSelector/lists/StocksHorizontalRow/StockTile'

export const StocksHorizontalRow = memo(function StocksHorizontalRow({
  tokens,
  onSelectRwaToken,
  expanded,
  onExpand,
}: StocksHorizontalRowProps): JSX.Element {
  return (
    <ExpandableTokenTileRow
      tokens={tokens}
      expanded={expanded}
      keyExtractor={keyExtractor}
      renderTile={(token) => <StockTile option={token} onSelectRwaToken={onSelectRwaToken} />}
      onExpand={onExpand}
    />
  )
})

function keyExtractor(token: RwaTokenOption): string {
  return `${token.chainId}-${token.address}`
}
