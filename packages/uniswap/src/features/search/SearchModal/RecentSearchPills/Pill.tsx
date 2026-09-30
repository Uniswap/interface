import { isMobileApp } from '@universe/environment'
import { Flex, iconSizes, spacing, Text, TouchableArea } from '@universe/mycelium'
import { ReactNode } from 'react'

/** Fixed pill height (24px leading + vertical padding), shared with the loading placeholder so it can't drift. */
export const PILL_HEIGHT = iconSizes.icon24 + spacing.spacing6 * 2

/** Bottom padding of the pill row (and its placeholder); mobile adds an 8px gap before the next section. */
export const PILL_ROW_PADDING_BOTTOM = isMobileApp ? '$spacing12' : '$spacing4'

export interface PillPressProps {
  modifierPressHref?: string
  onPress: () => void
  onModifierPress?: () => void
}

export function Pill({
  label,
  leading,
  dimmed = false,
  modifierPressHref,
  onPress,
  onModifierPress,
}: PillPressProps & {
  label: string
  leading: ReactNode
  dimmed?: boolean
}): JSX.Element {
  return (
    <TouchableArea
      accessibilityLabel={label}
      accessibilityRole="button"
      modifierPressHref={modifierPressHref}
      opacity={dimmed ? 0.5 : 1}
      onModifierPress={onModifierPress}
      onPress={onPress}
    >
      <Flex
        row
        alignItems="center"
        backgroundColor="$surface2"
        borderRadius="$rounded32"
        gap="$spacing4"
        height={PILL_HEIGHT}
        hoverStyle={{ backgroundColor: '$surface2Hovered' }}
        pl="$spacing6"
        pr="$spacing12"
      >
        {leading}
        <Text color="$neutral1" numberOfLines={1} variant="buttonLabel2">
          {label}
        </Text>
      </Flex>
    </TouchableArea>
  )
}
