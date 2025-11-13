import { ValueWithFadedDecimals } from 'pages/Portfolio/components/ValueWithFadedDecimals/ValueWithFadedDecimals'
import { EmptyTableCell } from 'pages/Portfolio/EmptyTableCell'
import { memo } from 'react'

export const Value = memo(function Value({ value }: { value: string }) {
  if (!value && value !== '0') {
    return <EmptyTableCell />
  }

  return <ValueWithFadedDecimals value={value} />
})
Value.displayName = 'Value'
