import { TableText } from 'components/Table/styled'
import { ValueWithFadedDecimals } from 'pages/Portfolio/components/ValueWithFadedDecimals/ValueWithFadedDecimals'
import { memo } from 'react'
import { EM_DASH } from 'ui/src'

export const Value = memo(function Value({ value }: { value: string }) {
  if (!value && value !== '0') {
    return <TableText>{EM_DASH}</TableText>
  }

  return <ValueWithFadedDecimals value={value} />
})
Value.displayName = 'Value'
