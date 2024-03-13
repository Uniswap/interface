import { ApolloError } from '@apollo/client'
import { Trans } from '@lingui/macro'
import {
  CellContext,
  ColumnDef,
  RowData,
  Table as TanstackTable,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import Loader from 'components/Icons/LoadingSpinner'
import { ErrorModal } from 'components/Table/ErrorBox'
import useDebounce from 'hooks/useDebounce'
import { useEffect, useRef, useState } from 'react'
import { ScrollSync, ScrollSyncPane } from 'react-scroll-sync'
import { ThemedText } from 'theme/components'
import { FadePresence } from 'theme/components/FadePresence'
import { Z_INDEX } from 'theme/zIndex'
import {
  CellContainer,
  DataRow,
  HeaderRow,
  LOAD_MORE_BOTTOM_OFFSET,
  LoadingIndicator,
  LoadingIndicatorContainer,
  NoDataFoundTableRow,
  ReturnButton,
  ReturnButtonContainer,
  ReturnIcon,
  SHOW_RETURN_TO_TOP_OFFSET,
  TableBodyContainer,
  TableContainer,
  TableHead,
  TableRowLink,
} from './styled'

function TableBody<Data extends RowData>({
  table,
  loading,
  error,
}: {
  table: TanstackTable<Data>
  loading?: boolean
  error?: ApolloError
}) {
  if (loading || error) {
    // loading and error states
    return (
      <>
        {Array.from({ length: 7 }, (_, rowIndex) => (
          <DataRow key={`skeleton-row-${rowIndex}`}>
            {table.getAllColumns().map((column, columnIndex) => (
              <CellContainer key={`skeleton-row-${rowIndex}-column-${columnIndex}`}>
                {flexRender(column.columnDef.cell, {} as CellContext<Data, any>)}
              </CellContainer>
            ))}
          </DataRow>
        ))}
        {error && (
          <ErrorModal
            header={<Trans>Error loading data</Trans>}
            subtitle={<Trans>Data is unavailable at the moment; we&apos;re working on a fix</Trans>}
          />
        )}
      </>
    )
  }

  if (!table.getRowModel()?.rows.length) {
    // no errors, but no data round
    return (
      <NoDataFoundTableRow>
        <ThemedText.BodySecondary>
          <Trans>No data found</Trans>
        </ThemedText.BodySecondary>
      </NoDataFoundTableRow>
    )
  }

  return (
    // data found
    <>
      {table.getRowModel().rows.map((row) => {
        const cells = row
          .getVisibleCells()
          .map((cell) => (
            <CellContainer key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</CellContainer>
          ))
        const rowOriginal = row.original as any
        const linkState = rowOriginal.linkState // optional data passed to linked page, accessible via useLocation().state
        const rowTestId = rowOriginal.testId
        return 'link' in rowOriginal && typeof rowOriginal.link === 'string' ? (
          <TableRowLink to={rowOriginal.link} key={row.id} state={linkState} data-testid={rowTestId}>
            <DataRow>{cells}</DataRow>
          </TableRowLink>
        ) : (
          <DataRow data-testid={rowTestId} key={row.id}>
            {cells}
          </DataRow>
        )
      })}
    </>
  )
}

export function Table<Data extends RowData>({
  columns,
  data,
  loading,
  error,
  loadMore,
  maxWidth,
  maxHeight,
}: {
  columns: ColumnDef<Data, any>[]
  data: Data[]
  loading?: boolean
  error?: ApolloError
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  maxWidth?: number
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
  const lastLoadedLengthRef = useRef(data?.length ?? 0)
  const canLoadMore = useRef(true)

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
    setShowReturn(!loading && !error && distanceFromTop >= SHOW_RETURN_TO_TOP_OFFSET)
    if (distanceToBottom < LOAD_MORE_BOTTOM_OFFSET && !loadingMore && loadMore && canLoadMore.current && !error) {
      setLoadingMore(true)
      // Manually update scroll position to prevent re-triggering
      setScrollPosition({
        distanceFromTop: SHOW_RETURN_TO_TOP_OFFSET,
        distanceToBottom: LOAD_MORE_BOTTOM_OFFSET,
      })
      loadMore({
        onComplete: () => {
          setLoadingMore(false)
          if (data?.length === lastLoadedLengthRef.current) {
            canLoadMore.current = false
          } else {
            lastLoadedLengthRef.current = data?.length ?? 0
          }
        },
      })
    }
  }, [data?.length, distanceFromTop, distanceToBottom, error, loadMore, loading, loadingMore])

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div>
      <ScrollSync>
        <TableContainer $maxWidth={maxWidth} $maxHeight={maxHeight}>
          <TableHead $isSticky={!maxHeight}>
            <ScrollSyncPane>
              <HeaderRow $dimmed={!!error}>
                {table.getFlatHeaders().map((header) => (
                  <CellContainer key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </CellContainer>
                ))}
              </HeaderRow>
            </ScrollSyncPane>
            {showReturn && (
              <FadePresence $zIndex={Z_INDEX.hover}>
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
            <TableBodyContainer>
              <TableBody loading={loading} error={error} table={table} />
            </TableBodyContainer>
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
