import { memo, PropsWithChildren } from 'react'
import { Flex, Text, type FlexProps } from 'ui/src'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { PoolsUnavailableIndicator } from 'uniswap/src/features/portfolio/PortfolioBalance/PoolsUnavailableIndicator'

interface TableSectionHeaderProps {
  title: string
  subtitle: string
  loading?: boolean
  testId?: string
  contentGap?: FlexProps['gap']
  totalValueFormatted?: string
  totalValueNumeric?: number
  totalValueLoading?: boolean
  warningMessage?: string
}

export const TableSectionHeader = memo(function TableSectionHeader({
  title,
  subtitle,
  loading,
  testId,
  contentGap = '$gap16',
  totalValueFormatted,
  totalValueNumeric,
  totalValueLoading,
  warningMessage,
  children,
}: PropsWithChildren<TableSectionHeaderProps>) {
  const showTotalValue = totalValueLoading || totalValueFormatted !== undefined

  return (
    <Flex gap={contentGap} data-testid={testId}>
      <Flex gap="$gap4" pl="$spacing8">
        <Flex row alignItems="center" gap="$spacing6">
          <Text variant="subheading1" color="$neutral1">
            {title}
          </Text>
          {showTotalValue && (
            <>
              <Text variant="subheading1" color="$neutral1">
                ·
              </Text>
              <AnimatedNumber
                value={totalValueFormatted}
                numericValue={totalValueNumeric}
                loading={totalValueLoading}
                textVariant="$subheading1"
                color="$neutral1"
                shouldFadeDecimals
              />
            </>
          )}
          {warningMessage !== undefined && <PoolsUnavailableIndicator message={warningMessage} iconSize="$icon.16" />}
        </Flex>
        <Text variant="body3" color="$neutral2" loading={loading}>
          {subtitle}
        </Text>
      </Flex>
      {children}
    </Flex>
  )
})
