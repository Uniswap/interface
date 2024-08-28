import { styled, Text } from 'ui/src'

const FilterButton = styled(Text, {
  display: 'flex',
  flexDirection: 'row',
  height: '100%',
  color: '$neutral1',
  backgroundColor: '$surface1',
  m: 0,
  p: '$spacing2',
  pr: 6,
  pl: 14,
  borderRadius: '$rounded12',
  fontSize: '$medium',
  lineHeight: 24,
  fontWeight: '$book',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$surface3',
  whiteSpace: 'nowrap',
  hoverStyle: {
    cursor: 'pointer',
    backgroundColor: '$surface2',
  },
  focusStyle: {
    backgroundColor: '$surface2',
  },
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
