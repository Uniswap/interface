import type { ColorTokens } from 'tamagui'
import { createStyledContext } from 'tamagui'
import { DropdownButtonVariantProps } from 'ui/src/components/buttons/DropdownButton/types'

export const EXPANDED_COLOR: ColorTokens = '$neutral2'
export const EXPANDED_HOVER_COLOR: ColorTokens = '$neutral2Hovered'

// this ensures that the variant can be passed to the frame but will also thread down to the inner `DropdownButtonText`

export const dropdownButtonStyledContext = createStyledContext<DropdownButtonVariantProps>({
  size: 'medium',
  variant: 'default',
  emphasis: 'primary',
  isDisabled: false,
  isExpanded: false,
})
