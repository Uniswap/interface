import { styled, Text } from 'ui/src'

export const TriggerButton = styled(Text, {
  m: 0,
  borderRadius: '$rounded12',
  borderStyle: 'solid',
  borderColor: '$surface3',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'row',
  height: '100%',
  color: '$neutral1',
  p: '$spacing2',
  pr: 6,
  pl: 14,
  fontSize: '$medium',
  lineHeight: 24,
  fontWeight: '$book',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  variants: {
    active: {
      true: {
        backgroundColor: '$surface2',
        focusStyle: {
          backgroundColor: '$surface2',
        },
      },
    },
    outlined: {
      true: {
        backgroundColor: '$surface1',
        borderWidth: 1,
        hoverStyle: {
          backgroundColor: '$surface2',
        },
        focusStyle: {
          backgroundColor: '$surface2',
        },
      },
      false: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        hoverStyle: {
          backgroundColor: 'transparent',
        },
        focusStyle: {
          backgroundColor: 'transparent',
        },
      },
    },
  } as const,
  defaultVariants: {
    outlined: true,
  },
})
