import { Flex, Text } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { TestID } from '@universe/test'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SingleSelectContextMenu, type SingleSelectOption } from 'uniswap/src/components/menus/SingleSelectContextMenu'
import { PortfolioChartCategory } from '~/pages/Portfolio/Overview/hooks/usePortfolioChartSeries'

/** Dropdown that picks which series the portfolio chart shows. */
export function PortfolioChartCategorySelector({
  value,
  availableCategories,
  onChange,
}: {
  value: PortfolioChartCategory
  /** Non-total categories with data, in fixed display order (tokens → earn → pools). */
  availableCategories: PortfolioChartCategory[]
  onChange: (value: PortfolioChartCategory) => void
}): JSX.Element {
  const { t } = useTranslation()

  const labelByValue = useMemo<Record<PortfolioChartCategory, string>>(
    () => ({
      [PortfolioChartCategory.Total]: t('common.totalBalance'),
      [PortfolioChartCategory.Tokens]: t('common.token.plural'),
      [PortfolioChartCategory.Earn]: t('common.earning'),
      [PortfolioChartCategory.Pools]: t('common.pools'),
    }),
    [t],
  )

  const options = useMemo<SingleSelectOption<PortfolioChartCategory>[]>(
    () => [
      { value: PortfolioChartCategory.Total, label: labelByValue[PortfolioChartCategory.Total] },
      ...availableCategories.map((category) => ({ value: category, label: labelByValue[category] })),
    ],
    [labelByValue, availableCategories],
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
          <RotatableChevron direction={isOpen ? 'up' : 'down'} size="$icon.16" color="$neutral2" />
        </Flex>
      )}
    </SingleSelectContextMenu>
  )
}
