import { TableText } from 'components/Table/styled'
import { useTableSize } from 'components/Table/TableSizeProvider'
import { memo } from 'react'
import { EM_DASH } from 'ui/src'
import { breakpoints } from 'ui/src/theme'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'

export const RelativeChange1D = memo(function RelativeChange1D({ value }: { value: number | undefined }): JSX.Element {
  const { width: tableWidth } = useTableSize()

  if (!value && value !== 0) {
    return <TableText>{EM_DASH}</TableText>
  }

  return (
    <RelativeChange
      change={value}
      arrowSize="$icon.16"
      negativeChangeColor="$statusCritical"
      positiveChangeColor="$statusSuccess"
      variant={tableWidth <= breakpoints.lg ? 'body3' : 'body2'}
      alignRight
    />
  )
})
RelativeChange1D.displayName = 'RelativeChange1D'
