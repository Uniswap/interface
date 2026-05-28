import { styled } from 'tamagui'
import { CustomButtonFrame } from 'ui/src/components/buttons/Button/components/CustomButtonFrame/CustomButtonFrame'
import { dropdownButtonStyledContext } from 'ui/src/components/buttons/DropdownButton/constants'

export const DropdownButtonFrame = styled(CustomButtonFrame, {
  context: dropdownButtonStyledContext,
  variant: 'default',
  justifyContent: 'space-between',
  variants: {
    isExpanded: {
      true: {},
      false: {},
    },
    emphasis: {
      secondary: (_, { props }) => {
        // @ts-expect-error we know isExpanded will be DropdownButtonProps['isExpanded']
        const isExpanded = props.isExpanded as DropdownButtonProps['isExpanded']

        if (!isExpanded) {
          return {}
        }

        return {
          backgroundColor: '$transparent',
          borderColor: '$surface3',
          hoverStyle: {
            borderColor: '$surface3Hovered',
            backgroundColor: '$transparent',
          },
        }
      },
      tertiary: (_, { props }) => {
        // @ts-expect-error we know isExpanded will be DropdownButtonProps['isExpanded']
        const isExpanded = props.isExpanded as DropdownButtonProps['isExpanded']

        if (!isExpanded) {
          return {}
        }

        return {
          backgroundColor: '$transparent',
        }
      },
      'text-only': (_, { props }) => {
        // @ts-expect-error we know isExpanded will be DropdownButtonProps['isExpanded']
        const isExpanded = props.isExpanded as DropdownButtonProps['isExpanded']

        if (!isExpanded) {
          return {}
        }

        return {
          backgroundColor: '$transparent',
        }
      },
    },
    elementPositioning: {
      equal: {},
      grouped: {},
    },
  } as const,
})

DropdownButtonFrame.displayName = 'DropdownButtonFrame'
