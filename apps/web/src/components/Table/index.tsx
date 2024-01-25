import { Trans } from '@lingui/macro'
import { CellContext, ColumnDef, flexRender, getCoreRowModel, RowData, useReactTable } from '@tanstack/react-table'
import Loader from 'components/Icons/LoadingSpinner'
import useDebounce from 'hooks/useDebounce'
import { useEffect, useRef } from 'react'
import { useState } from 'react'
import { ScrollSync, ScrollSyncPane } from 'react-scroll-sync'
import { FadePresence } from 'theme/components/FadePresence'

import {
  CellContainer,
  DataRow,
  HeaderRow,
  LOAD_MORE_BOTTOM_OFFSET,
  LoadingIndicator,
  LoadingIndicatorContainer,
  ReturnButton,
  ReturnButtonContainer,
  ReturnIcon,
  SHOW_RETURN_TO_TOP_OFFSET,
  TableBody,
  TableContainer,
  TableHead,
  TableRowLink,
} from './styled'

export function Table<Data extends RowData>({
  columns,
  data,
  loading,
  loadMore,
  maxHeight,
}: {
  columns: ColumnDef<Data, any>[]
  data: Data[]
  loading?: boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  maxHeight?: number
}) {
  const [showReturn, setShowReturn] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const [scrollPosition, setScrollPosition] = useState<{
    distanceFromTop: number
    distanceToBottom: number
  }>({
    distanceFromTop: 0,
    distanceToBottom: LOAD_MORE_BOTTOM_OFFSET,
  })
  const { distanceFromTop, distanceToBottom } = useDebounce(scrollPosition, 125)
  const tableBodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollableElement = maxHeight ? tableBodyRef.current : window
    if (scrollableElement === null) {
      return
    }
    const updateScrollPosition = () => {
      if (scrollableElement instanceof HTMLDivElement) {
        const { scrollTop, scrollHeight, clientHeight } = scrollableElement
        setScrollPosition({
          distanceFromTop: scrollTop,
          distanceToBottom: scrollHeight - scrollTop - clientHeight,
        })
      } else {
        setScrollPosition({
          distanceFromTop: scrollableElement.scrollY,
          distanceToBottom: document.body.scrollHeight - scrollableElement.scrollY - scrollableElement.innerHeight,
        })
      }
    }
    scrollableElement.addEventListener('scroll', updateScrollPosition)
    return () => scrollableElement.removeEventListener('scroll', updateScrollPosition)
  }, [loadMore, maxHeight, loadingMore])

  useEffect(() => {
    setShowReturn(distanceFromTop >= SHOW_RETURN_TO_TOP_OFFSET)
    if (distanceToBottom < LOAD_MORE_BOTTOM_OFFSET && !loadingMore && loadMore) {
      setLoadingMore(true)
      // Manually update scroll position to prevent re-triggering
      setScrollPosition({
        distanceFromTop: SHOW_RETURN_TO_TOP_OFFSET,
        distanceToBottom: LOAD_MORE_BOTTOM_OFFSET,
      })
      loadMore({
        onComplete: () => {
          setLoadingMore(false)
        },
      })
    }
  }, [distanceFromTop, distanceToBottom, loadMore, loadingMore])

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div>
      <ScrollSync>
        <TableContainer $maxHeight={maxHeight}>
          <TableHead $isSticky={!maxHeight}>
            <ScrollSyncPane>
              <HeaderRow>
                {table.getFlatHeaders().map((header) => (
                  <CellContainer key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </CellContainer>
                ))}
              </HeaderRow>
            </ScrollSyncPane>
            {showReturn && (
              <FadePresence>
                <ReturnButtonContainer $top={maxHeight ? 55 : 75}>
                  <ReturnButton
                    height="24px"
                    onClick={() => {
                      setShowReturn(false)
                      const scrollableElement = maxHeight ? tableBodyRef.current : window
                      scrollableElement?.scrollTo({
                        top: 0,
                        behavior: 'smooth',
                      })
                    }}
                  >
                    <ReturnIcon />
                    <Trans>Return to top</Trans>
                  </ReturnButton>
                </ReturnButtonContainer>
              </FadePresence>
            )}
          </TableHead>
          <ScrollSyncPane innerRef={tableBodyRef}>
            <TableBody>
              {loading || !table.getRowModel()?.rows
                ? Array.from({ length: 25 }, (_, rowIndex) => (
                    <DataRow key={`skeleton-row-${rowIndex}`}>
                      {table.getAllColumns().map((column, columnIndex) => (
                        <CellContainer key={`skeleton-row-${rowIndex}-column-${columnIndex}`}>
                          {flexRender(column.columnDef.cell, {} as CellContext<Data, any>)}
                        </CellContainer>
                      ))}
                    </DataRow>
                  ))
                : table.getRowModel().rows.map((row) => {
                    const cells = row
                      .getVisibleCells()
                      .map((cell) => (
                        <CellContainer key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </CellContainer>
                      ))
                    const rowOriginal = row.original as any
                    return 'link' in rowOriginal && typeof rowOriginal.link === 'string' ? (
                      <TableRowLink to={rowOriginal.link} key={row.id}>
                        <DataRow>{cells}</DataRow>
                      </TableRowLink>
                    ) : (
                      <DataRow key={row.id}>{cells}</DataRow>
                    )
                  })}
            </TableBody>
          </ScrollSyncPane>
          <LoadingIndicatorContainer show={loadingMore}>
            <LoadingIndicator>
              <Loader />
              <Trans>Loading</Trans>
            </LoadingIndicator>
          </LoadingIndicatorContainer>
        </TableContainer>
      </ScrollSync>
    </div>
  )
}
