import { SharedEventName } from '@uniswap/analytics-events'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Briefcase } from 'ui/src/components/icons/Briefcase'
import { Etf } from 'ui/src/components/icons/Etf'
import { Nut } from 'ui/src/components/icons/Nut'
import { Ranking } from 'ui/src/components/icons/Ranking'
import { TouchableArea } from 'ui/src/components/touchable'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ExploreCategory } from '~/pages/Explore/categories/useExploreCategory'

interface ExploreCategoryChipsProps {
  value: ExploreCategory
  onChange: (category: ExploreCategory) => void
}

type CategoryOption = {
  value: ExploreCategory
  label: string
  renderIcon: (color: '$neutral1' | '$neutral2') => JSX.Element
}

/** Rounded filter chip shared by the Explore tab filter rows (token categories, auction quick filters). */
export function ExploreFilterChip({
  active,
  label,
  renderIcon,
  onPress,
}: {
  active: boolean
  label: string
  renderIcon: (color: '$neutral1' | '$neutral2') => JSX.Element
  onPress: () => void
}): JSX.Element {
  const color = active ? '$neutral1' : '$neutral2'

  return (
    <TouchableArea
      group
      row
      alignItems="center"
      borderRadius="$roundedFull"
      backgroundColor={active ? '$surface3' : '$transparent'}
      hoverStyle={{ backgroundColor: active ? '$surface3Hovered' : '$surface2Hovered' }}
      px="$spacing12"
      py="$spacing8"
      height="$spacing36"
      $platform-web={{ minWidth: 'max-content' }}
      onPress={onPress}
    >
      <Flex row alignItems="center" gap="$spacing6">
        {renderIcon(color)}
        <Text
          variant="buttonLabel3"
          color={color}
          $platform-web={{ whiteSpace: 'nowrap' }}
          $group-hover={{ color: '$neutral1' }}
        >
          {label}
        </Text>
      </Flex>
    </TouchableArea>
  )
}

/** Popular | Stocks | Commodities | ETFs category chips above the Explore token table. */
export function ExploreCategoryChips({ value, onChange }: ExploreCategoryChipsProps): JSX.Element {
  const { t } = useTranslation()

  const options: readonly CategoryOption[] = useMemo(
    () => [
      {
        value: ExploreCategory.Popular,
        label: t('common.popular'),
        renderIcon: (color) => <Ranking size="$icon.16" color={color} $group-hover={{ color: '$neutral1' }} />,
      },
      {
        value: ExploreCategory.Stocks,
        label: t('common.stocks'),
        renderIcon: (color) => <Briefcase size="$icon.16" color={color} $group-hover={{ color: '$neutral1' }} />,
      },
      {
        value: ExploreCategory.Commodities,
        label: t('common.commodities'),
        renderIcon: (color) => <Nut size="$icon.16" color={color} $group-hover={{ color: '$neutral1' }} />,
      },
      {
        value: ExploreCategory.Etfs,
        label: t('common.etfs'),
        renderIcon: (color) => <Etf size="$icon.16" color={color} $group-hover={{ color: '$neutral1' }} />,
      },
    ],
    [t],
  )

  return (
    <Flex row alignItems="center">
      {options.map((option) => {
        const active = option.value === value
        return (
          <ExploreFilterChip
            key={option.value}
            active={active}
            label={option.label}
            renderIcon={option.renderIcon}
            onPress={() => {
              if (active) {
                return
              }
              sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
                element: ElementName.ExploreRwaCategoryView,
                tab: option.value,
              })
              onChange(option.value)
            }}
          />
        )
      })}
    </Flex>
  )
}
