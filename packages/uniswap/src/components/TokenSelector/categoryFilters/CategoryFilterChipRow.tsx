import { SharedEventName } from '@uniswap/analytics-events'
import { Flex, iconSizes, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader } from 'ui/src'
import {
  type CategoryFilterChip,
  MY_TOKENS_CHIP_ID,
} from 'uniswap/src/components/TokenSelector/categoryFilters/categoryFilterChips'
import { HorizontalFadeScroll } from 'uniswap/src/components/TokenSelectorV2/HorizontalFadeScroll'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import type { AddressGroup } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getTokenCategoryIcon } from 'uniswap/src/features/tokenCategories/categoryIcons'
import { CATEGORY_PILL_HEIGHT, Pill } from 'uniswap/src/features/tokenCategories/CategoryPill'
import { useEvent } from 'utilities/src/react/hooks'

const SKELETON_CHIP_WIDTHS = [112, 96]

type ChipColor = '$neutral1' | '$neutral2'

function Chip({
  id,
  label,
  renderIcon,
  active,
  onToggle,
}: {
  id: string
  label: string
  renderIcon: (color: ChipColor) => JSX.Element
  active: boolean
  onToggle: (id: string) => void
}): JSX.Element {
  const onPress = useEvent(() => {
    // The My tokens sentinel is not a taxonomy id; keep it out of the shared `category_id` dimension.
    sendAnalyticsEvent(
      SharedEventName.ELEMENT_CLICKED,
      id === MY_TOKENS_CHIP_ID
        ? { element: ElementName.TokenSelectorMyTokensFilterChip, active: !active }
        : { element: ElementName.TokenSelectorCategoryFilterChip, category_id: id, active: !active },
    )
    onToggle(id)
  })

  const color: ChipColor = active ? '$neutral1' : '$neutral2'

  return (
    <Pill
      accessibilityLabel={label}
      accessibilityRole="button"
      active={active}
      // aria-selected (not accessibilityState) — Tamagui forwards it to the DOM on web; RN treats it as the alias
      aria-selected={active}
      gap="$spacing6"
      testID={`${TestID.TokenSelectorCategoryFilterChipPrefix}${id}`}
      onPress={onPress}
    >
      {renderIcon(color)}
      <Text color={color} variant="buttonLabel3" $platform-web={{ whiteSpace: 'nowrap' }}>
        {label}
      </Text>
    </Pill>
  )
}

export const CategoryFilterChipRow = memo(function CategoryFilterChipRow({
  chips,
  activeIds,
  addresses,
  onToggle,
}: {
  chips: CategoryFilterChip[]
  activeIds: string[]
  /** The My tokens chip shows this account's avatar. */
  addresses: AddressGroup
  onToggle: (id: string) => void
}): JSX.Element | null {
  const { t } = useTranslation()
  const accountAddress = addresses.evmAddress ?? addresses.svmAddress

  if (chips.length === 0) {
    return null
  }

  return (
    <Flex pb="$spacing8" testID={TestID.TokenSelectorCategoryFilterChipRow}>
      <HorizontalFadeScroll>
        <Flex row gap="$spacing8" px="$spacing20">
          {chips.map((chip) => {
            const CategoryIcon = chip.category ? getTokenCategoryIcon(chip.category) : undefined
            return (
              <Chip
                key={chip.id}
                active={activeIds.includes(chip.id)}
                id={chip.id}
                label={chip.category ? chip.category.name : t('tokens.selector.categoryFilter.myTokens')}
                renderIcon={(color) =>
                  CategoryIcon ? (
                    <CategoryIcon color={color} size="$icon.16" />
                  ) : (
                    <AccountIcon address={accountAddress} size={iconSizes.icon16} />
                  )
                }
                onToggle={onToggle}
              />
            )
          })}
        </Flex>
      </HorizontalFadeScroll>
    </Flex>
  )
})

/** Holds the row's height while results load so chips don't pop in after the rows. */
export function CategoryFilterChipRowSkeleton(): JSX.Element {
  return (
    <Flex row gap="$spacing8" pb="$spacing8" px="$spacing20">
      {SKELETON_CHIP_WIDTHS.map((width) => (
        <Loader.Box key={width} borderRadius="$roundedFull" height={CATEGORY_PILL_HEIGHT} width={width} />
      ))}
    </Flex>
  )
}
