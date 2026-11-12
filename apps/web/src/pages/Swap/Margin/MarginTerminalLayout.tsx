import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, spacing } from '@universe/mycelium'
import { ArrowDownArrowUp } from '@universe/mycelium/icons/ArrowDownArrowUp'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useParentSize } from '@visx/responsive'
import { Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { useEvent } from 'utilities/src/react/hooks'
import { APP_BODY_MOBILE_GUTTER_PX } from '~/constants/layout'
import { useSwapAndLimitContext } from '~/features/Swap/state/useSwapContext'
import { useAppHeaderHeight } from '~/hooks/useAppHeaderHeight'
import { usePrefersReducedMotion } from '~/hooks/usePrefersReducedMotion'
import { useHeightBeforePaint } from '~/pages/Swap/Margin/hooks/useHeightBeforePaint'
import { MarginMorphProvider } from '~/pages/Swap/Margin/MarginMorphContext'
import { MARGIN_TABLE_PANE_CHROME, MARGIN_TABLE_ROW_HEIGHT } from '~/pages/Swap/Margin/marginTableConstants'
import { useMarginTerminalResizeStore } from '~/pages/Swap/Margin/marginTerminalResizeStore'
import { createLazyNoReload } from '~/utils/lazyWithRetry'

// This layout wraps every swap tab, so a static import would pull the review modal (and the
// plan-execution graph behind it) into the main chunk on every page load.
//
// Retried on a chunk miss (the stale-hashed-URL case after a deploy) rather than bare `lazy`, which
// rejects with no retry and lets React rethrow into the top-level error boundary — and because this
// layout wraps EVERY swap tab, that would take plain /swap down with it.
//
// The NO-RELOAD variant specifically, matching the top-level modal registry: both boundaries here mount
// EAGERLY for the whole flag-on session rather than in response to a user action, and `createLazy`
// refreshes the page once its retries are exhausted. A background listener whose entire job is a toast
// must never reload the page under someone mid-swap — and on a live plan a surprise navigation is worse
// still, while a reload into the same deploy skew fails identically. This variant also declines to cache
// the failure, so both recover on the next mount once the chunk is fetchable again.
const MarginPlanReviewModal = createLazyNoReload(() =>
  import('~/pages/Swap/Margin/MarginPlanReviewModal').then((m) => ({ default: m.MarginPlanReviewModal })),
)

// The same door, one hook wide: the completion listener reads positions and the plan-execution store,
// so importing it statically would land that graph in the entry chunk for flag-off users — undoing
// what the lazy boundary above buys. Rendered under the same Suspense, which is why it is a component
// rather than a bare hook call.
const MarginCompletionToastListener = createLazyNoReload(() =>
  import('~/pages/Swap/Margin/hooks/useMarginCompletionToast').then((m) => ({
    default: function CompletionToastListener(): null {
      m.useMarginCompletionToast()
      return null
    },
  })),
)

export const MARGIN_FORM_RAIL_WIDTH = 400
// PageWrapper's top padding on the terminal route (Swap/index.tsx), subtracted from the pinned height
// so shell + padding is exactly the viewport under the app header. 10px sits between spacing8 and
// spacing12, so there is no token for it.
export const MARGIN_TERMINAL_TOP_PADDING = 10
// Space between the chart block and the positions pane, doubling as the resize handle's hit strip.
export const MARGIN_CHART_TABLE_GAP = spacing.spacing12

// The positions pane's at-rest share, budgeted in table rows so the at-rest layout never shows a sliced
// row: 22% of the column, floored at three rows and capped at four, so on a taller monitor it is the
// chart that grows. Under the share the pane is only as tall as its content; past it, the column
// scrolls.
const TABLE_ROWS_SHARE = 0.22
const TABLE_MIN_ROWS = 3
const TABLE_MAX_ROWS = 4
// The $spacing2 gap `Table` puts between rows.
const TABLE_ROW_GAP = spacing.spacing2
// The chart block (stats strip, OHLC legend, chart, controls) never shrinks past this, so on a short
// viewport the positions pane gives rows back instead of crushing the chart.
export const MARGIN_CHART_BLOCK_MIN_HEIGHT = 350

function tableRowsHeight(rows: number): number {
  return rows * MARGIN_TABLE_ROW_HEIGHT + Math.max(0, rows - 1) * TABLE_ROW_GAP
}

/**
 * Default height of the chart block in a terminal column `columnHeight` tall. The positions pane takes
 * what its content needs (`paneContentHeight`: tabs, header and rows, or the empty state), up to its
 * row budget, and the chart takes the rest, never dropping below its floor. So one position leaves
 * the chart nearly the whole column. Before the content is measured the pane is given its full budget.
 * Exported for the resize handle, which starts every drag from it.
 */
export function defaultMarginChartBlockHeight({
  columnHeight,
  paneContentHeight,
}: {
  columnHeight: number
  paneContentHeight?: number
}): number {
  const share = columnHeight * TABLE_ROWS_SHARE - MARGIN_TABLE_PANE_CHROME
  const rows = Math.min(
    TABLE_MAX_ROWS,
    Math.max(TABLE_MIN_ROWS, Math.floor((share + TABLE_ROW_GAP) / (MARGIN_TABLE_ROW_HEIGHT + TABLE_ROW_GAP))),
  )
  const paneBudget = MARGIN_TABLE_PANE_CHROME + tableRowsHeight(rows)
  const pane = paneContentHeight ? Math.min(paneContentHeight, paneBudget) : paneBudget
  return Math.max(MARGIN_CHART_BLOCK_MIN_HEIGHT, columnHeight - MARGIN_CHART_TABLE_GAP - pane)
}

/**
 * Bounds a dragged chart block height: the chart keeps its floor, and the positions pane keeps its
 * chrome plus one row. On a column too short for both, the chart's floor wins.
 */
export function clampMarginChartBlockHeight({
  columnHeight,
  wanted,
}: {
  columnHeight: number
  wanted: number
}): number {
  const ceiling = columnHeight - MARGIN_CHART_TABLE_GAP - MARGIN_TABLE_PANE_CHROME - tableRowsHeight(1)
  return Math.max(MARGIN_CHART_BLOCK_MIN_HEIGHT, Math.min(wanted, ceiling))
}

/**
 * The chart block's heights in a terminal row `rowHeight` tall. `split` is what the resize handle drags
 * from: the default budget or a saved drag, once the positions pane is measured. `height` is what the
 * block renders at: the split once it exists, so the chart keeps its floor and the pane its row budget
 * (more positions scroll the column); before that, a saved drag (it needs only the row, so the chart
 * mounts at final size); otherwise undefined → flex:1 until the pane measures.
 */
export function resolveMarginChartBlockHeights({
  hasPositionsPane,
  rowHeight,
  chartBlockOverride,
  paneContentHeight,
}: {
  hasPositionsPane: boolean
  rowHeight: number
  chartBlockOverride: number | undefined
  paneContentHeight: number | undefined
}): { height: number | undefined; split: number | undefined } {
  if (!hasPositionsPane || rowHeight <= 0) {
    return { height: undefined, split: undefined }
  }
  const split =
    paneContentHeight === undefined
      ? undefined
      : clampMarginChartBlockHeight({
          columnHeight: rowHeight,
          wanted: chartBlockOverride ?? defaultMarginChartBlockHeight({ columnHeight: rowHeight, paneContentHeight }),
        })
  const saved =
    chartBlockOverride === undefined
      ? undefined
      : clampMarginChartBlockHeight({ columnHeight: rowHeight, wanted: chartBlockOverride })
  return { height: split ?? saved, split }
}

/**
 * The positions table's `maxHeight` in the terminal. The chart block's height is fixed, so more
 * positions scroll the whole column (the rail stays put); the table body may grow to a full column of
 * rows and only scrolls itself past that. `Table`'s maxHeight subtracts the app header height (its
 * sticky offset), so that is added back. Undefined until the column is measured.
 */
export function marginTableMaxHeight({
  columnHeight,
  appHeaderHeight,
}: {
  columnHeight: number
  appHeaderHeight: number
}): number | undefined {
  return columnHeight > 0 ? Math.round(appHeaderHeight + columnHeight - MARGIN_TABLE_PANE_CHROME) : undefined
}

// The view cross-fades as one unit (useMarginViewTransition on the view root); there are no per-element
// entrance animations here. The chart just needs a stable block to mount into so it doesn't resize as it
// appears (see chartBlockReady / morphSettled below).

const CHART_COLUMN_SCROLL_STYLE: CSSProperties = { scrollbarGutter: 'stable', scrollbarWidth: 'thin' }
const CHART_COLUMN_HIDDEN_STYLE: CSSProperties = { ...CHART_COLUMN_SCROLL_STYLE, visibility: 'hidden' }

export function useIsMarginTerminal(): boolean {
  const isMarginEnabled = useFeatureFlag(FeatureFlags.Margin)
  const { currentTab } = useSwapAndLimitContext()
  const media = useMedia()
  // media.xl === viewport ≤1024px (Tamagui media queries are max-width).
  return isMarginEnabled && currentTab === SwapTab.Margin && !media.xl
}

/**
 * Whether the terminal morph may animate. Exported because it gates TWO halves of one motion — this
 * layout's geometry and the form rail's width in Swap/index.tsx — and a term added to one spelling and
 * not the other makes one side snap while the other glides. Structural, so the halves cannot drift.
 *
 * Flag-gated as well as interaction-gated: `hasInteracted` arms on ANY tab click, so without the flag a
 * flag-off user who clicks Limit once would carry a max-width transition and watch the page ease its
 * width over 300ms on a window drag-resize instead of tracking it.
 */
export function useMarginMorphAnimation(hasInteracted: boolean): boolean {
  const isMarginEnabled = useFeatureFlag(FeatureFlags.Margin)
  const reducedMotion = usePrefersReducedMotion()
  return isMarginEnabled && hasInteracted && !reducedMotion
}

// The flag, deferred chunks and markets query resolve at different times on a direct /margin load, so the
// terminal holds a blank until all have settled rather than show a half-built shell. Settled, not
// populated: a markets error or an empty list is the chart pane's to show.
export function isMarginTerminalReady({
  flagLoading,
  isMarginEnabled,
  chunksLoaded,
  marketsLoading,
}: {
  flagLoading: boolean
  isMarginEnabled: boolean
  chunksLoaded: boolean
  marketsLoading: boolean
}): boolean {
  return !flagLoading && isMarginEnabled && chunksLoaded && !marketsLoading
}

export function MarginTerminalLayout({
  isTerminal,
  rootRef,
  chartRef,
  chartPane,
  positionsTable,
  nonTerminalChartAnimator,
  nonTerminalSidePanel,
  children,
}: {
  isTerminal: boolean
  // The view root the cross-fade fades, and the chart column it slides in over that fade (marginMorph).
  rootRef?: RefObject<HTMLDivElement | null>
  chartRef?: RefObject<HTMLDivElement | null>
  chartPane?: JSX.Element | null
  positionsTable?: JSX.Element | null
  nonTerminalChartAnimator?: JSX.Element | null
  nonTerminalSidePanel?: JSX.Element | null
  children: ReactNode
}): JSX.Element {
  const isMarginEnabled = useFeatureFlag(FeatureFlags.Margin)
  const headerHeight = useAppHeaderHeight()

  // The column's height is set by the pinned shell (never by its own content), so budgeting the chart
  // block off it can't loop. Measured on the ROW: the chart column mounts late (chartPane is a
  // deferred import). Measured before paint: the row outlives a swap → margin switch, so a late measure
  // would size the chart block off the shorter swap layout for the first frames of the fade-in.
  const { ref: rowRef, height: rowHeight } = useHeightBeforePaint()
  const hasPositionsPane = isTerminal && Boolean(positionsTable)
  const [paneContentHeight, setPaneContentHeight] = useState<number | undefined>(undefined)
  const chartBlockOverride = useMarginTerminalResizeStore((state) => state.chartBlockHeight)
  const setChartBlockHeight = useMarginTerminalResizeStore((state) => state.setChartBlockHeight)
  const { height: chartBlockHeight, split: chartBlockSplit } = resolveMarginChartBlockHeights({
    hasPositionsPane,
    rowHeight,
    chartBlockOverride,
    paneContentHeight,
  })
  // Mount the chart only once the block is at its final height, so it fits its content once: a saved drag
  // is final when the row measures; the default split when the pane measures.
  const chartBlockReady = !hasPositionsPane || chartBlockHeight !== undefined
  const morphSettled = isTerminal && chartBlockReady
  const tableMaxHeight = hasPositionsPane
    ? marginTableMaxHeight({ columnHeight: rowHeight, appHeaderHeight: headerHeight })
    : undefined
  const onResizeChartBlock = useEvent((wanted: number): void => {
    // Clamped on write as well as read: storing raw travel would bank phantom pixels past a bound
    // that the user would then have to drag back through before anything moved.
    setChartBlockHeight(clampMarginChartBlockHeight({ columnHeight: rowHeight, wanted }))
  })
  // The terminal owns the viewport: the shell is pinned to what is left under the app header, so
  // nothing scrolls the page — the chart column and the form rail each scroll on their own.
  const terminalHeight = `calc(100dvh - ${headerHeight}px - ${MARGIN_TERMINAL_TOP_PADDING}px)`

  return (
    <Flex
      ref={rootRef}
      // No easing: the cross-fade commits this layout only after the old view has faded out.
      maxWidth={isTerminal ? '100vw' : `calc(100vw - ${2 * APP_BODY_MOBILE_GUTTER_PX}px)`}
      minWidth={isTerminal ? '100vw' : 0}
      minHeight={isTerminal ? terminalHeight : 0}
      // Not in the transition: the morph's vertical growth rides min-height, and this only clamps the
      // ceiling to the value it lands on.
      maxHeight={isTerminal ? terminalHeight : undefined}
      // Full-bleed: the page gutter is the only horizontal inset, with no content max-width.
      px={isTerminal ? '$spacing32' : '$none'}
      pb={isTerminal ? '$spacing24' : '$none'}
    >
      <Flex
        row
        ref={rowRef}
        // Terminal: stretch so the chart column and the form rail both span the pinned height.
        alignItems={isTerminal ? 'stretch' : 'flex-start'}
        gap={isTerminal ? '$spacing24' : undefined}
        flex={isTerminal ? 1 : undefined}
        minHeight={isTerminal ? 0 : undefined}
        width={isTerminal ? '100%' : undefined}
      >
        {/* Conditional siblings keep positional slots ({cond && ...} renders a hole, not a
            reorder), so the SwapModuleWrapper child below never changes tree position. */}
        {!isTerminal && nonTerminalChartAnimator}
        <MarginMorphProvider morphSettled={morphSettled} tableMaxHeight={tableMaxHeight}>
          {isTerminal && chartPane ? (
            // Left column: chart block over the positions pane, one width; the form rail sits to the
            // right and the table never extends under it.
            <Flex
              ref={chartRef}
              flex={1}
              minWidth={0}
              minHeight={0}
              // The column is its own scroll box. Stable gutter: a scrollbar appearing never narrows
              // the column and shifts the chart's price axis.
              $platform-web={{ overflowX: 'hidden', overflowY: 'auto' }}
              // Hidden until the block takes its split height: the pane measures a frame or two after it
              // mounts, and until then the block flexes, so the chart and table would visibly jump.
              style={chartBlockReady ? CHART_COLUMN_SCROLL_STYLE : CHART_COLUMN_HIDDEN_STYLE}
            >
              {/* Block the chart pane fills. The class exempts it from the global layout-animation
                  height-ease (global.css) so it doesn't ease as the pane settles. */}
              <Flex
                className="margin-chart-size-static"
                flex={chartBlockHeight === undefined ? 1 : undefined}
                flexShrink={0}
                height={chartBlockHeight}
                minHeight={0}
              >
                {chartPane}
              </Flex>
              {/* Keyed on the split, not the pinned height, so the handle is present whether or not the
                  user has dragged — a drag doesn't toggle it in and reflow the chart. */}
              {hasPositionsPane && chartBlockSplit !== undefined ? (
                <MarginChartResizeHandle chartBlockHeight={chartBlockSplit} onResize={onResizeChartBlock} />
              ) : null}
              {hasPositionsPane ? (
                <Flex
                  flexShrink={0}
                  // Before the pane is measured there is no handle yet; hold its gap until it appears.
                  mt={chartBlockSplit === undefined ? MARGIN_CHART_TABLE_GAP : undefined}
                >
                  <MeasuredPaneContent onHeightChange={setPaneContentHeight}>{positionsTable}</MeasuredPaneContent>
                </Flex>
              ) : null}
            </Flex>
          ) : null}
        </MarginMorphProvider>
        {children}
        {!isTerminal && nonTerminalSidePanel}
      </Flex>
      {/* Mounted at layout level for the whole flag-on session (renders null until a plan
          exists); execution state is global via marginPlanExecutionStore, so CTA callers
          need no prop drilling. */}
      {isMarginEnabled && (
        <Suspense fallback={null}>
          {/* Mounted beside the modal because that pair outlives the positions table, which renders
              only on the terminal view — a plan finishing with the table off screen must still toast. */}
          <MarginCompletionToastListener />
          <MarginPlanReviewModal />
        </Suspense>
      )}
    </Flex>
  )
}

/**
 * The positions pane's content at its natural height, reported up so the layout can size the pane to
 * it. Its own component because useParentSize attaches its observer once, on mount: the pane mounts
 * after the layout (the table is a deferred import), so a ref owned by the layout would never measure.
 */
function MeasuredPaneContent({
  onHeightChange,
  children,
}: {
  onHeightChange: (height: number | undefined) => void
  children: ReactNode
}): JSX.Element {
  // No debounce so the chart block takes its final height on the first measure — see rowRef above.
  const { parentRef, height } = useParentSize({ debounceTime: 0 })
  useEffect(() => {
    onHeightChange(height > 0 ? height : undefined)
  }, [height, onHeightChange])
  useEffect(() => () => onHeightChange(undefined), [onHeightChange])
  return (
    <Flex ref={parentRef} flexShrink={0} width="100%">
      {children}
    </Flex>
  )
}

/**
 * The chart ↔ positions gap as a drag handle: hovering reveals a divider with a centered ↓↑ grip, and
 * dragging trades positions-pane height for chart height. Native pointer listeners on the element, with
 * pointer capture so the drag survives the handle moving out from under the cursor as the layout
 * follows it.
 */
function MarginChartResizeHandle({
  chartBlockHeight,
  onResize,
}: {
  chartBlockHeight: number
  onResize: (wanted: number) => void
}): JSX.Element {
  const [handle, setHandle] = useState<HTMLElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ pointerId: number; startY: number; startHeight: number } | undefined>(undefined)

  const onPointerDown = useEvent((event: PointerEvent): void => {
    if (!handle) {
      return
    }
    event.preventDefault()
    handle.setPointerCapture(event.pointerId)
    dragRef.current = { pointerId: event.pointerId, startY: event.clientY, startHeight: chartBlockHeight }
    setIsDragging(true)
  })
  const onPointerMove = useEvent((event: PointerEvent): void => {
    const drag = dragRef.current
    if (!drag || event.pointerId !== drag.pointerId) {
      return
    }
    // The handle sits under the chart: dragging down grows the chart, up grows the positions pane.
    onResize(drag.startHeight + (event.clientY - drag.startY))
  })
  const onPointerEnd = useEvent((): void => {
    dragRef.current = undefined
    setIsDragging(false)
  })

  useEffect(() => {
    if (!handle) {
      return undefined
    }
    handle.addEventListener('pointerdown', onPointerDown)
    handle.addEventListener('pointermove', onPointerMove)
    handle.addEventListener('pointerup', onPointerEnd)
    handle.addEventListener('pointercancel', onPointerEnd)
    return () => {
      handle.removeEventListener('pointerdown', onPointerDown)
      handle.removeEventListener('pointermove', onPointerMove)
      handle.removeEventListener('pointerup', onPointerEnd)
      handle.removeEventListener('pointercancel', onPointerEnd)
    }
  }, [handle, onPointerDown, onPointerMove, onPointerEnd])

  return (
    <Flex
      group
      ref={setHandle}
      height={MARGIN_CHART_TABLE_GAP}
      flexShrink={0}
      alignItems="center"
      justifyContent="center"
      position="relative"
      style={{ cursor: 'ns-resize', touchAction: 'none' }}
      testID={TestID.MarginChartResizeHandle}
    >
      {/* Kept visible for the whole drag, which can leave the hit strip. Opacity only: a color-token
          transition would flash on a theme switch. */}
      <Flex
        width="100%"
        alignItems="center"
        justifyContent="center"
        className={`${isDragging ? 'opacity-100' : 'opacity-0'} transition-opacity duration-150 group-hover:opacity-100`}
      >
        <Flex position="absolute" left={0} right={0} height={1} backgroundColor="$surface3" />
        <Flex
          px="$spacing6"
          py="$spacing2"
          borderRadius="$roundedFull"
          backgroundColor="$surface2"
          borderWidth={1}
          borderColor="$surface3"
        >
          <ArrowDownArrowUp size="$icon.12" color="$neutral2" />
        </Flex>
      </Flex>
    </Flex>
  )
}
