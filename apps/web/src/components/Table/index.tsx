import { ApolloError } from "@apollo/client";
import {
  CellContext,
  ColumnDef,
  RowData,
  Table as TanstackTable,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Loader from "components/Icons/LoadingSpinner";
import { ErrorModal } from "components/Table/ErrorBox";
import { useDebounce } from "hooks/useDebounce";
import { Trans } from "i18n";
import { useEffect, useRef, useState } from "react";
import { ScrollSync, ScrollSyncPane } from "react-scroll-sync";
import { ThemedText } from "theme/components";
import { FadePresence } from "theme/components/FadePresence";
import { Z_INDEX } from "theme/zIndex";
import Trace from "uniswap/src/features/telemetry/Trace";
import { useTrace } from "utilities/src/telemetry/trace/TraceContext";
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
} from "./styled";

function TableBody<Data extends RowData>({
  table,
  loading,
  error,
}: {
  table: TanstackTable<Data>;
  loading?: boolean;
  error?: ApolloError;
}) {
  const analyticsContext = useTrace();

  if (loading || error) {
    // loading and error states
    return (
      <>
        {Array.from({ length: 7 }, (_, rowIndex) => (
          <DataRow key={`skeleton-row-${rowIndex}`}>
            {table.getAllColumns().map((column, columnIndex) => (
              <CellContainer
                key={`skeleton-row-${rowIndex}-column-${columnIndex}`}
              >
                {flexRender(
                  column.columnDef.cell,
                  {} as CellContext<Data, any>
                )}
              </CellContainer>
            ))}
          </DataRow>
        ))}
        {error && (
          <ErrorModal
            header={<Trans i18nKey="common.errorLoadingData.error" />}
            subtitle={<Trans i18nKey="error.dataUnavailable" />}
          />
        )}
      </>
    );
  }

  if (!table.getRowModel()?.rows.length) {
    // no errors, but no data round
    return (
      <NoDataFoundTableRow>
        <ThemedText.BodySecondary>
          <Trans i18nKey="error.noData" />
        </ThemedText.BodySecondary>
      </NoDataFoundTableRow>
    );
  }

  return (
    // data found
    <>
      {table.getRowModel().rows.map((row) => {
        const cells = row
          .getVisibleCells()
          .map((cell) => (
            <CellContainer key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </CellContainer>
          ));
        const rowOriginal = row.original as any;
        const linkState = rowOriginal.linkState; // optional data passed to linked page, accessible via useLocation().state
        const rowTestId = rowOriginal.testId;

        const isHighlighted = rowOriginal.eligible;
        return (
          <Trace
            logPress
            element={rowOriginal.analytics?.elementName}
            properties={{
              ...rowOriginal.analytics?.properties,
              ...analyticsContext,
            }}
            key={row.id}
          >
            {"link" in rowOriginal && typeof rowOriginal.link === "string" ? (
              <TableRowLink
                to={rowOriginal.link}
                state={linkState}
                data-testid={rowTestId}
              >
                <DataRow>{cells}</DataRow>
              </TableRowLink>
            ) : isHighlighted ? (
              <EligibleTableRow
                data-testid={rowTestId}
                eligible={isHighlighted}
              >
                {cells}
              </EligibleTableRow>
            ) : (
              <DataRow data-testid={rowTestId}>{cells}</DataRow>
            )}
          </Trace>
        );
      })}
    </>
  );
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
  columns: ColumnDef<Data, any>[];
  data: Data[];
  loading?: boolean;
  error?: ApolloError;
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void;
  maxWidth?: number;
  maxHeight?: number;
}) {
  const [showReturn, setShowReturn] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [scrollPosition, setScrollPosition] = useState<{
    distanceFromTop: number;
    distanceToBottom: number;
  }>({
    distanceFromTop: 0,
    distanceToBottom: LOAD_MORE_BOTTOM_OFFSET,
  });
  const { distanceFromTop, distanceToBottom } = useDebounce(
    scrollPosition,
    125
  );
  const tableBodyRef = useRef<HTMLDivElement>(null);
  const lastLoadedLengthRef = useRef(data?.length ?? 0);
  const canLoadMore = useRef(true);

  useEffect(() => {
    const scrollableElement = maxHeight ? tableBodyRef.current : window;
    if (scrollableElement === null) {
      return;
    }
    const updateScrollPosition = () => {
      if (scrollableElement instanceof HTMLDivElement) {
        const { scrollTop, scrollHeight, clientHeight } = scrollableElement;
        setScrollPosition({
          distanceFromTop: scrollTop,
          distanceToBottom: scrollHeight - scrollTop - clientHeight,
        });
      } else {
        setScrollPosition({
          distanceFromTop: scrollableElement.scrollY,
          distanceToBottom:
            document.body.scrollHeight -
            scrollableElement.scrollY -
            scrollableElement.innerHeight,
        });
      }
    };
    scrollableElement.addEventListener("scroll", updateScrollPosition);
    return () =>
      scrollableElement.removeEventListener("scroll", updateScrollPosition);
  }, [loadMore, maxHeight, loadingMore]);

  useEffect(() => {
    setShowReturn(
      !loading && !error && distanceFromTop >= SHOW_RETURN_TO_TOP_OFFSET
    );
    if (
      distanceToBottom < LOAD_MORE_BOTTOM_OFFSET &&
      !loadingMore &&
      loadMore &&
      canLoadMore.current &&
      !error
    ) {
      setLoadingMore(true);
      // Manually update scroll position to prevent re-triggering
      setScrollPosition({
        distanceFromTop: SHOW_RETURN_TO_TOP_OFFSET,
        distanceToBottom: LOAD_MORE_BOTTOM_OFFSET,
      });
      loadMore({
        onComplete: () => {
          setLoadingMore(false);
          if (data?.length === lastLoadedLengthRef.current) {
            canLoadMore.current = false;
          } else {
            lastLoadedLengthRef.current = data?.length ?? 0;
          }
        },
      });
    }
  }, [
    data?.length,
    distanceFromTop,
    distanceToBottom,
    error,
    loadMore,
    loading,
    loadingMore,
  ]);

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <ScrollSync>
        <TableContainer $maxWidth={maxWidth} $maxHeight={maxHeight}>
          <TableHead $isSticky={!maxHeight}>
            <ScrollSyncPane>
              <HeaderRow $dimmed={!!error}>
                {table.getFlatHeaders().map((header) => (
                  <CellContainer key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
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
                      setShowReturn(false);
                      const scrollableElement = maxHeight
                        ? tableBodyRef.current
                        : window;
                      scrollableElement?.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });
                    }}
                  >
                    <ReturnIcon />
                    <Trans i18nKey="common.returnToTop" />
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
              <Trans i18nKey="common.loading" />
            </LoadingIndicator>
          </LoadingIndicatorContainer>
        </TableContainer>
      </ScrollSync>
    </div>
  );
}

import styled from "styled-components";

// Base Row Style
const EligibleTableRow = styled(DataRow)<{ eligible: boolean }>`
  background: ${(props) =>
    props.eligible
      ? "linear-gradient(115deg, #011a08,#032e12)" // Cool gradient for eligible
      : "inherit"}; // Neutral background for others
  border-radius: 8px;
  box-shadow: ${(props) =>
    props.eligible ? "0 4px 8px rgba(0, 0, 0, 0.2)" : "none"};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  marginbottom: 0.3rem;

  &:hover {
    transform: ${(props) => (props.eligible ? "scale(1.02)" : "none")};
    box-shadow: ${(props) =>
      props.eligible ? "0 6px 12px rgba(0, 0, 0, 0.3)" : "none"};
  }
`;
