import { memo } from 'react'
import { Text } from 'ui/src'
import { HeaderCell } from '~/components/Table/styled'

interface ColumnHeaderProps {
  label: string
  justifyContent?: 'flex-start' | 'center' | 'flex-end'
}

export const ColumnHeader = memo(function ColumnHeader({ label, justifyContent = 'flex-end' }: ColumnHeaderProps) {
  return (
    <HeaderCell justifyContent={justifyContent}>
      <Text variant="body3" color="$neutral2" fontWeight="500">
        {label}
      </Text>
    </HeaderCell>
  )
})
