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
  variants: {
    v2: {
      true: {
        borderRadius: '$rounded12',
      },
      false: {
        borderRadius: '$rounded20',
      },
    },
  },
})

export const DataRow = styled(TableRowBase, {
  variants: {
    v2: {
      true: {
        hoverStyle: {
          backgroundColor: '$surface1Hovered',
          transition: 'background-color 0ms',
        },
      },
      false: {
        hoverStyle: { backgroundColor: '$surface1Hovered' },
      },
    },
    dimmed: {
      true: {
        opacity: 0.6,
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
})
