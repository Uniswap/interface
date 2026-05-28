import { TextProps } from 'ui/src/components/text/Text'

export const ActionButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  py: '$spacing8',
  px: '$spacing12',
  borderRadius: 20,
  borderWidth: 0,
  width: 'maxContent',

  hoverStyle: {
    backgroundColor: '$surface2Hovered',
  },
  focusStyle: {
    backgroundColor: '$surface1Hovered',
  },
} satisfies TextProps
