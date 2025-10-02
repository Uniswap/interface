import { TableText } from 'components/Table/styled'
import { ValueWithFadedDecimals } from 'pages/Portfolio/components/ValueWithFadedDecimals/ValueWithFadedDecimals'
import { TokenData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { memo } from 'react'
import { EM_DASH } from 'ui/src'

const Balance = memo(function Balance({ value, symbol }: TokenData['balance']) {
  if (!value && value !== '0') {
    return <TableText>{EM_DASH}</TableText>
  }

  return (
    <TableText>
      <ValueWithFadedDecimals value={value} /> {symbol}
    </TableText>
  )
})
Balance.displayName = 'Balance'

export default Balance
