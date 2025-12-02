import { TableText } from 'components/Table/styled'
import { useFormattedTimeForActivity } from 'uniswap/src/components/activity/hooks/useFormattedTime'

interface TimeCellProps {
  timestamp: number
}

export function TimeCell({ timestamp }: TimeCellProps) {
  const formattedTime = useFormattedTimeForActivity(timestamp)
  return (
    <TableText variant="body3" color="$neutral2">
      {formattedTime}
    </TableText>
  )
}
