import { memo, PropsWithChildren } from 'react'
import { Flex, Text, type FlexProps } from 'ui/src'

interface TableSectionHeaderProps {
  title: string
  subtitle: string
  loading?: boolean
  testId?: string
  contentGap?: FlexProps['gap']
}

export const TableSectionHeader = memo(function TableSectionHeader({
  title,
  subtitle,
  loading,
  testId,
  contentGap = '$gap16',
  children,
}: PropsWithChildren<TableSectionHeaderProps>) {
  return (
    <Flex gap={contentGap} data-testid={testId}>
      <Flex gap="$gap4" pl="$spacing8">
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
