import { RowData, Table as TanstackTable } from '@tanstack/react-table'
import { AnimatePresence, Flex } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { TableScrollMask } from '~/components/Table/TableScrollMask'
import { TableScrollButton } from '~/components/Table/TableSideScrollButtons/TableScrollButton'

type TableSideScrollButtonsProps<T extends RowData> = {
  showScrollLeftButton: boolean
  showScrollRightButton: boolean
  showRightFadeOverlay: boolean
  scrollButtonTop: number
  onScrollButtonPress: (direction: 'left' | 'right') => () => void
  table: TanstackTable<T>
  isSticky: boolean
}

export function TableSideScrollButtons<T extends RowData>({
  showScrollLeftButton,
  showScrollRightButton,
  showRightFadeOverlay,
  scrollButtonTop,
  onScrollButtonPress,
  table,
  isSticky,
}: TableSideScrollButtonsProps<T>): JSX.Element {
  return (
    <>
      <AnimatePresence>
        {showScrollLeftButton && (
          <Flex
            position="absolute"
            top={scrollButtonTop}
            left={table.getLeftTotalSize()}
            pl="$spacing12"
            zIndex={zIndexes.mask}
            animateEnter="fadeIn"
            animateExit="fadeOut"
            animation="200ms"
          >
            <TableScrollButton onPress={onScrollButtonPress('left')} direction="left" />
          </Flex>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showScrollRightButton && (
          <Flex
            position="absolute"
            top={scrollButtonTop}
            right={0}
            pr="$spacing12"
            zIndex={zIndexes.mask}
            animateEnter="fadeIn"
            animateExit="fadeOut"
            animation="200ms"
          >
            <TableScrollButton onPress={onScrollButtonPress('right')} direction="right" />
          </Flex>
        )}
      </AnimatePresence>
      {showRightFadeOverlay && (
        <TableScrollMask
          top={isSticky ? '$spacing12' : 0}
          zIndex={zIndexes.dropdown - 1}
          right={0}
          borderTopRightRadius="$rounded12"
        />
      )}
    </>
  )
}
