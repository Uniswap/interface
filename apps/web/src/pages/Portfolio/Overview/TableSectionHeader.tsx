import { memo, PropsWithChildren } from 'react'
import { Flex, Text } from 'ui/src'

interface TableSectionHeaderProps {
  title: string
  subtitle: string
  loading?: boolean
}

export const TableSectionHeader = memo(function TableSectionHeader({
  title,
  subtitle,
  loading,
  children,
}: PropsWithChildren<TableSectionHeaderProps>) {
  return (
    <Flex gap="$gap16">
      <Flex gap="$gap4">
        <Text variant="subheading1" color="$neutral1">
          {title}
        </Text>
        <Text variant="body3" color="$neutral2" loading={loading}>
          {subtitle}
        </Text>
      </Flex>
      {children}
    </Flex>
  )
})
