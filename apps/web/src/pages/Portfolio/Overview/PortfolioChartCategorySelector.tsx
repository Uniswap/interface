import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { SingleSelectContextMenu, type SingleSelectOption } from 'uniswap/src/components/menus/SingleSelectContextMenu'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { PortfolioChartCategory } from '~/pages/Portfolio/Overview/hooks/usePortfolioChartSeries'

/** Dropdown that picks which series the portfolio chart shows. */
export function PortfolioChartCategorySelector({
  value,
  onChange,
}: {
  value: PortfolioChartCategory
  onChange: (value: PortfolioChartCategory) => void
}): JSX.Element {
  const { t } = useTranslation()

  const labelByValue = useMemo<Record<PortfolioChartCategory, string>>(
    () => ({
      [PortfolioChartCategory.Total]: t('common.totalBalance'),
      [PortfolioChartCategory.Tokens]: t('common.tokens'),
      [PortfolioChartCategory.Pools]: t('common.pools'),
    }),
    [t],
  )

  const options = useMemo<SingleSelectOption<PortfolioChartCategory>[]>(
    () => [
      { value: PortfolioChartCategory.Total, label: labelByValue[PortfolioChartCategory.Total] },
      { value: PortfolioChartCategory.Tokens, label: labelByValue[PortfolioChartCategory.Tokens] },
      { value: PortfolioChartCategory.Pools, label: labelByValue[PortfolioChartCategory.Pools] },
    ],
    [labelByValue],
  )

  return (
    <SingleSelectContextMenu dimBackground options={options} selectedValue={value} onSelect={onChange}>
      {({ isOpen }) => (
        <Flex
          row
          alignItems="center"
          alignSelf="flex-end"
          flexShrink={0}
          gap="$spacing4"
          borderColor="$surface3"
          borderWidth="$spacing1"
          borderRadius="$roundedFull"
          pl="$spacing12"
          pr="$spacing8"
          py="$spacing6"
          cursor="pointer"
          testID={TestID.PortfolioChartCategorySelector}
        >
          <Text variant="buttonLabel4" color="$neutral1" numberOfLines={1} flexShrink={0}>
            {labelByValue[value]}
          </Text>
          <RotatableChevron animation="200ms" direction={isOpen ? 'up' : 'down'} size="$icon.16" color="$neutral2" />
        </Flex>
      )}
    </SingleSelectContextMenu>
  )
}
