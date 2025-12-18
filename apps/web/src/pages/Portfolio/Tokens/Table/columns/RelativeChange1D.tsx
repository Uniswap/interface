import { EmptyTableCell } from 'pages/Portfolio/EmptyTableCell'
import { memo } from 'react'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'

export const RelativeChange1D = memo(function RelativeChange1D({ value }: { value: number | undefined }): JSX.Element {
  if (!value && value !== 0) {
    return <EmptyTableCell />
  }

  return (
    <RelativeChange
      change={value}
      arrowSize="$icon.16"
      negativeChangeColor="$statusCritical"
      positiveChangeColor="$statusSuccess"
      color="$neutral1"
      variant="body3"
      alignRight
    />
  )
})
RelativeChange1D.displayName = 'RelativeChange1D'
