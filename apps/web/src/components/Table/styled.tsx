import { Flex, styled } from 'ui/src'
import { Cell } from '~/components/Table/Cell'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

export const TableRowBase = styled(Flex, {
  row: true,
  alignItems: 'center',
  width: 'fit-content',
  minWidth: '100%',
  height: '100%',
  transition: 'background-color 0.1s ease-in-out',
  borderRadius: '$rounded12',
})

export const DataRow = styled(TableRowBase, {
  hoverStyle: {
    backgroundColor: '$surface1Hovered',
    transition: 'background-color 0ms',
  },
  variants: {
    dimmed: {
      true: {
        opacity: 0.6,
      },
    },
    embeddedInExpandableGroup: {
      true: {
        backgroundColor: 'transparent',
        hoverStyle: {
          backgroundColor: 'transparent',
        },
      },
    },
    embeddedInIssuerPanel: {
      true: {
        backgroundColor: 'transparent',
        hoverStyle: {
          backgroundColor: 'transparent',
        },
      },
    },
    // Defined last so the selected fill wins over embedded hover backgrounds when both apply.
    selected: {
      true: {
        backgroundColor: '$surface3',
        hoverStyle: {
          backgroundColor: '$surface3',
        },
      },
    },
  },
})

export const CellContainer = styled(Flex, {
  grow: true,
  className: 'first-child-flex-grow-0 last-child-justify-end',
})

export const FilterHeaderRow = styled(Flex, {
  row: true,
  alignItems: 'center',
  userSelect: 'none',
  gap: '$gap4',
  transition: 'all 0.1s ease-in-out',
  ...ClickableTamaguiStyle,

  variants: {
    clickable: {
      true: ClickableTamaguiStyle,
    },
  } as const,
})

export const HeaderCell = styled(Cell, {
  py: '$spacing12',

  variants: {
    clickable: {
      true: {
        cursor: 'pointer',
      },
    },
  } as const,
})
