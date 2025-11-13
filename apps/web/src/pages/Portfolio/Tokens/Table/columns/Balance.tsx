import { TableText } from 'components/Table/styled'
import { ValueWithFadedDecimals } from 'pages/Portfolio/components/ValueWithFadedDecimals/ValueWithFadedDecimals'
import { EmptyTableCell } from 'pages/Portfolio/EmptyTableCell'
import { TokenData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { memo } from 'react'

export const Balance = memo(function Balance({ value, symbol }: TokenData['balance']) {
  if (!value && value !== '0') {
    return <EmptyTableCell />
  }

  return (
    <TableText numberOfLines={1}>
      <ValueWithFadedDecimals value={value} /> {symbol}
    </TableText>
  )
})
Balance.displayName = 'Balance'
