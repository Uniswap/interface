import { Flex, Input, styled } from 'ui/src'

export const MenuItem = styled(Flex, {
  row: true,
  justifyContent: 'space-between',
  alignItems: 'center',
  py: '$spacing4',
  px: '$spacing20',
  height: '$spacing60',
  gap: '$gap16',
  cursor: 'pointer',
  width: '100%',

  '$platform-web': {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(auto, 1fr) auto minmax(0, 72px)',
  },

  hoverStyle: {
    backgroundColor: '$surface3',
  },

  variants: {
    disabled: {
      true: {
        cursor: 'default',
        pointerEvents: 'none',
        opacity: 0.4,
      },
    },
    selected: {
      true: {
        opacity: 0.4,
      },
    },
    dim: {
      true: {
        opacity: 0.4,
      },
    },
  } as const,
})

export const SearchInput = styled(Input, {
  py: '$padding16',
  pl: '$spacing40',
  pr: '$padding16',
  height: '$spacing40',
  alignItems: 'center',
  width: '100%',
  whiteSpace: 'nowrap',
  backgroundColor: '$surface2',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$surface3',
  borderRadius: '$rounded12',
  color: '$neutral1',
  fontWeight: '500',
  fontSize: 16,
  outlineWidth: 0,

  '$platform-web': {
    WebkitAppearance: 'none',
  },

  placeholderTextColor: '$neutral3',

  focusStyle: {
    borderColor: '$surface3',
    backgroundColor: '$surface2',
    outlineWidth: 0,
  },
})
