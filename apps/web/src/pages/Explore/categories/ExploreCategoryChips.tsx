import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, SegmentedControl, type SegmentedControlOption, Text } from 'ui/src'
import { Briefcase } from 'ui/src/components/icons/Briefcase'
import { Etf } from 'ui/src/components/icons/Etf'
import { Nut } from 'ui/src/components/icons/Nut'
import { Ranking } from 'ui/src/components/icons/Ranking'
import type { ExploreCategory } from '~/pages/Explore/categories/useExploreCategory'

interface ExploreCategoryChipsProps {
  value: ExploreCategory
  onChange: (category: ExploreCategory) => void
}

function CategoryOptionDisplay({
  active,
  icon,
  label,
}: {
  active: boolean
  icon: JSX.Element
  label: string
}): JSX.Element {
  const color = active ? '$neutral1' : '$neutral2'

  return (
    <Flex row alignItems="center" gap="$spacing6">
      {icon}
      <Text variant="buttonLabel3" hoverStyle={{ color: '$neutral1' }} color={color}>
        {label}
      </Text>
    </Flex>
  )
}

/** Popular | Stocks | Commodities | ETFs category chips above the Explore token table. */
export function ExploreCategoryChips({ value, onChange }: ExploreCategoryChipsProps): JSX.Element {
  const { t } = useTranslation()

  const options: readonly SegmentedControlOption<ExploreCategory>[] = useMemo(
    () => [
      {
        value: 'popular',
        display: (
          <CategoryOptionDisplay
            active={value === 'popular'}
            icon={<Ranking size="$icon.16" color={value === 'popular' ? '$neutral1' : '$neutral2'} />}
            label={t('common.popular')}
          />
        ),
      },
      {
        value: 'stocks',
        display: (
          <CategoryOptionDisplay
            active={value === 'stocks'}
            icon={<Briefcase size="$icon.16" color={value === 'stocks' ? '$neutral1' : '$neutral2'} />}
            label={t('common.stocks')}
          />
        ),
      },
      {
        value: 'commodities',
        display: (
          <CategoryOptionDisplay
            active={value === 'commodities'}
            icon={<Nut size="$icon.16" color={value === 'commodities' ? '$neutral1' : '$neutral2'} />}
            label={t('common.commodities')}
          />
        ),
      },
      {
        value: 'etfs',
        display: (
          <CategoryOptionDisplay
            active={value === 'etfs'}
            icon={<Etf size="$icon.16" color={value === 'etfs' ? '$neutral1' : '$neutral2'} />}
            label={t('common.etfs')}
          />
        ),
      },
    ],
    [t, value],
  )

  return (
    <SegmentedControl
      outlined={false}
      size="large"
      gap="$spacing0"
      options={options}
      selectedOption={value}
      onSelectOption={onChange}
    />
  )
}
