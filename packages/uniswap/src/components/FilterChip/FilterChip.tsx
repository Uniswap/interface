import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { useState } from 'react'
import { useEvent } from 'utilities/src/react/hooks'

export const FILTER_CHIP_FADE_MS = 200
const CHIP_FADE_TRANSITION = `opacity ${FILTER_CHIP_FADE_MS}ms ease`

export type FilterChipColor = '$neutral1' | '$neutral2'

/** Rounded single-select filter chip: filled when active, borderless otherwise. */
export function FilterChip({
  active,
  label,
  renderIcon,
  renderTrailingIcon,
  onPress,
  testID,
  'aria-haspopup': ariaHasPopup,
}: {
  active: boolean
  label?: string
  renderIcon?: (color: FilterChipColor) => JSX.Element
  renderTrailingIcon?: (color: FilterChipColor) => JSX.Element
  onPress: () => void
  testID?: string
  'aria-haspopup'?: 'dialog'
}): JSX.Element {
  // Hover state lives here rather than in `$group-hover` so the label and the caller-rendered icons
  // brighten together. Mouse events only fire on web.
  const [isHovered, setIsHovered] = useState(false)
  const onMouseEnter = useEvent(() => setIsHovered(true))
  const onMouseLeave = useEvent(() => setIsHovered(false))
  const color: FilterChipColor = active || isHovered ? '$neutral1' : '$neutral2'

  return (
    <TouchableArea
      row
      alignItems="center"
      borderRadius="$roundedFull"
      backgroundColor={active ? '$surface3' : '$transparent'}
      hoverStyle={{ backgroundColor: active ? '$surface3Hovered' : '$surface2Hovered' }}
      px="$spacing12"
      py="$spacing8"
      height="$spacing36"
      testID={testID}
      aria-haspopup={ariaHasPopup}
      $platform-web={{ minWidth: 'max-content', transition: CHIP_FADE_TRANSITION }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onPress={onPress}
    >
      <Flex row alignItems="center" gap="$spacing6">
        {renderIcon?.(color)}
        {label !== undefined && (
          <Text variant="buttonLabel3" color={color} $platform-web={{ whiteSpace: 'nowrap' }}>
            {label}
          </Text>
        )}
        {renderTrailingIcon?.(color)}
      </Flex>
    </TouchableArea>
  )
}
