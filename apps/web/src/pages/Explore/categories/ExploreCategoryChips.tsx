import { SharedEventName } from '@uniswap/analytics-events'
import { Flex, iconSizes, spacing, useIsTouchDevice } from '@universe/mycelium'
import { InfoCircleFilled } from '@universe/mycelium/icons/InfoCircleFilled'
import { TestID } from '@universe/test'
import { useEffect, useState } from 'react'
import { FILTER_CHIP_FADE_MS, FilterChip } from 'uniswap/src/components/FilterChip/FilterChip'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { useEvent } from 'utilities/src/react/hooks'
import { CategoryDefinitionSheet } from '~/components/CategoryDefinitionCard/CategoryDefinitionSheet'
import { CategoryHoverCard } from '~/components/HoverCard/CategoryHoverCard/CategoryHoverCard'
import { ExploreCategoryChipOption } from '~/pages/Explore/categories/exploreCategoryChipOptions'

const CHIP_FADE_MS = FILTER_CHIP_FADE_MS
const CHIP_FADE_TRANSITION = `opacity ${CHIP_FADE_MS}ms ease`
const INFO_ICON_TRANSITION = `width ${CHIP_FADE_MS}ms ease, margin-left ${CHIP_FADE_MS}ms ease, opacity ${CHIP_FADE_MS}ms ease`

// TODO(CONS-2740): point the Explore/Launches filter rows at FilterChip directly and drop this alias.
export { FilterChip as ExploreFilterChip }

interface ExploreCategoryChipsProps {
  options: ExploreCategoryChipOption[]
  value: string
  onChange: (category: string) => void
  /** Fade-swaps the last option (the flex slot): fade out the current chip, then fade in the new one. */
  fadeSwapLastOption?: boolean
}

interface CategoryChipProps {
  option: ExploreCategoryChipOption
  value: string
  onChange: (category: string) => void
  onOpenDefinition: (category: TokenCategory) => void
}

/** Collapses to nothing on inactive chips, cancelling the chip's gap, so a selection change slides rather than jumps. */
function ChipInfoIcon({ visible }: { visible: boolean }): JSX.Element {
  return (
    <Flex
      width={visible ? iconSizes.icon16 : 0}
      marginLeft={visible ? 0 : -spacing.spacing6}
      opacity={visible ? 1 : 0}
      overflow="hidden"
      aria-hidden={!visible}
      testID={TestID.ExploreCategoryChipInfo}
      $platform-web={{ transition: INFO_ICON_TRANSITION }}
    >
      <InfoCircleFilled color="$neutral3" size="$icon.16" />
    </Flex>
  )
}

function CategoryChip({ option, value, onChange, onOpenDefinition }: CategoryChipProps): JSX.Element {
  const active = option.id === value
  const Icon = option.icon
  const isTouchDevice = useIsTouchDevice()
  // Touch has no hover card, so the selected chip shows an info icon and its next tap opens the definition.
  const definitionCategory = isTouchDevice ? option.category : undefined

  const onPress = useEvent((): void => {
    if (!active) {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: ElementName.ExploreRwaCategoryView,
        tab: option.id,
      })
      onChange(option.id)
      return
    }
    if (!definitionCategory) {
      return
    }
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.ExploreCategoryChipDefinition,
      section: SectionName.ExploreCategoryChips,
      category_id: definitionCategory.id,
    })
    onOpenDefinition(definitionCategory)
  })

  return (
    <CategoryHoverCard category={option.category} section={SectionName.ExploreCategoryChips}>
      <FilterChip
        active={active}
        label={option.label}
        renderIcon={Icon ? (color) => <Icon size="$icon.16" color={color} /> : undefined}
        renderTrailingIcon={definitionCategory ? () => <ChipInfoIcon visible={active} /> : undefined}
        aria-haspopup={definitionCategory && active ? 'dialog' : undefined}
        onPress={onPress}
      />
    </CategoryHoverCard>
  )
}

/** Defers option swaps by one fade: the outgoing chip stays rendered while faded out, then the new one fades in. */
function useFadeSwappedOption(option: ExploreCategoryChipOption): {
  displayedOption: ExploreCategoryChipOption
  faded: boolean
} {
  const [displayedOption, setDisplayedOption] = useState(option)
  const [faded, setFaded] = useState(false)

  useEffect(() => {
    if (option.id === displayedOption.id) {
      setDisplayedOption(option)
      setFaded(false)
      return undefined
    }
    setFaded(true)
    const timeout = setTimeout(() => {
      setDisplayedOption(option)
      setFaded(false)
    }, CHIP_FADE_MS)
    return () => clearTimeout(timeout)
  }, [option, displayedOption.id])

  return { displayedOption, faded }
}

function FlexSlotChip({ option, ...props }: CategoryChipProps): JSX.Element {
  const { displayedOption, faded } = useFadeSwappedOption(option)
  return (
    <Flex
      opacity={faded ? 0 : 1}
      pointerEvents={faded ? 'none' : 'auto'}
      $platform-web={{ transition: CHIP_FADE_TRANSITION }}
    >
      <CategoryChip option={displayedOption} {...props} />
    </Flex>
  )
}

/** Category filter chips above the Explore token table (static set, or ListCategories-driven behind the flag). */
export function ExploreCategoryChips({
  options,
  value,
  onChange,
  fadeSwapLastOption = false,
}: ExploreCategoryChipsProps): JSX.Element {
  const [definitionCategory, setDefinitionCategory] = useState<TokenCategory>()
  const [isDefinitionOpen, setIsDefinitionOpen] = useState(false)
  const openDefinition = useEvent((category: TokenCategory): void => {
    setDefinitionCategory(category)
    setIsDefinitionOpen(true)
  })
  const closeDefinition = useEvent((): void => setIsDefinitionOpen(false))

  return (
    <Flex row alignItems="center" gap="$spacing4" $platform-web={{ transition: CHIP_FADE_TRANSITION }}>
      {options.map((option, index) =>
        fadeSwapLastOption && index === options.length - 1 ? (
          <FlexSlotChip
            key="flex-slot"
            option={option}
            value={value}
            onChange={onChange}
            onOpenDefinition={openDefinition}
          />
        ) : (
          <CategoryChip
            key={option.id}
            option={option}
            value={value}
            onChange={onChange}
            onOpenDefinition={openDefinition}
          />
        ),
      )}
      {definitionCategory && (
        <CategoryDefinitionSheet
          category={definitionCategory}
          isOpen={isDefinitionOpen}
          section={SectionName.ExploreCategoryChips}
          onClose={closeDefinition}
        />
      )}
    </Flex>
  )
}
