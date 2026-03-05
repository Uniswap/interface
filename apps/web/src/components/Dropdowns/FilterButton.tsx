import type { FlexProps } from 'ui/src'
import { styled, Text } from 'ui/src'

export const baseActionButtonStyles = {
  backgroundColor: '$surface1',
  m: 0,
  borderRadius: '$rounded12',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$surface3',
  flexShrink: 0,
  hoverStyle: {
    cursor: 'pointer',
    backgroundColor: '$surface2',
  },
  focusStyle: {
    backgroundColor: '$surface2',
  },
} satisfies FlexProps

const FilterButton = styled(Text, {
  ...baseActionButtonStyles,
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
  variants: {
    active: {
      true: {
        backgroundColor: '$surface2',
        focusStyle: {
          backgroundColor: '$surface2',
        },
      },
    },
  } as const,
})

export default FilterButton
