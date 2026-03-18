import { styled } from 'tamagui'
import { CustomButtonText } from 'ui/src/components/buttons/Button/components/CustomButtonText/CustomButtonText'
import {
  dropdownButtonStyledContext,
  EXPANDED_COLOR,
  EXPANDED_HOVER_COLOR,
} from 'ui/src/components/buttons/DropdownButton/constants'

export const DropdownButtonText = styled(CustomButtonText, {
  context: dropdownButtonStyledContext,
  variants: {
    isExpanded: {
      true: {
        color: EXPANDED_COLOR,
        hoverStyle: {
          color: EXPANDED_HOVER_COLOR,
        },
        '$group-item-hover': {
          color: EXPANDED_HOVER_COLOR,
        },
      },
    },
  } as const,
})

DropdownButtonText.displayName = 'DropdownButtonText'
