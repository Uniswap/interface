import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex } from '@universe/mycelium'
import { ENTER_PRESET_CLASSES } from '@universe/mycelium/compat'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { APP_BODY_MOBILE_GUTTER_PX } from '~/app/layout/constants'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { useSwapAndLimitContext } from '~/features/Swap/state/useSwapContext'
import { useAppHeaderHeight } from '~/hooks/useAppHeaderHeight'
import { usePrefersReducedMotion } from '~/hooks/usePrefersReducedMotion'
import { MarginMorphProvider } from '~/pages/Swap/Margin/MarginMorphContext'
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

export const MARGIN_FORM_RAIL_WIDTH = 420
// ≈ $spacing36 gutters.
const TERMINAL_GUTTER = '$spacing36'
// Cap the chart+form row and positions table at the same width as /explore; the outer
// wrapper stays full-bleed (the morph rides its 100vw min-width), so only the inner
// content is capped + centered.
const TERMINAL_CONTENT_MAX_WIDTH = MAX_WIDTH_MEDIA_BREAKPOINT

// Comfortably past the 300ms quickLong geometry morph (+~60ms paint margin) so the chart
// pane mounts lightweight-charts the instant the container stops resizing — never mid-reflow.
const MORPH_SETTLE_MS = 360

// Gates the chart mount on the morph completing. Keyed on isTerminal (not timeframe) so
// re-entering the tab re-bridges with the skeleton, but switching timeframes never re-flashes.
function useMorphSettled({ isTerminal, animateMorph }: { isTerminal: boolean; animateMorph: boolean }): boolean {
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    if (!isTerminal) {
      setSettled(false)
      return undefined
    }
    if (!animateMorph) {
      // Cold deep-link / reduced-motion: final layout paints at once — settle immediately, no artificial delay.
      setSettled(true)
      return undefined
    }
    const id = setTimeout(() => setSettled(true), MORPH_SETTLE_MS)
    return () => clearTimeout(id)
  }, [isTerminal, animateMorph])
  return settled
}

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

export function MarginTerminalLayout({
  isTerminal,
  hasInteracted,
  chartPane,
  positionsTable,
  nonTerminalChartAnimator,
  nonTerminalSidePanel,
  children,
}: {
  isTerminal: boolean
  hasInteracted: boolean
  chartPane?: JSX.Element | null
  positionsTable?: JSX.Element | null
  nonTerminalChartAnimator?: JSX.Element | null
  nonTerminalSidePanel?: JSX.Element | null
  children: ReactNode
}): JSX.Element {
  const isMarginEnabled = useFeatureFlag(FeatureFlags.Margin)
  const headerHeight = useAppHeaderHeight()
  // Motion only on user tab clicks — never on first paint / deep link. Shared with the rail's width
  // transition, so the two halves of the morph cannot disagree.
  const animateMorph = useMarginMorphAnimation(hasInteracted)
  // Geometry morph as a CSS transition scoped to the exact properties that change (never color —
  // an unscoped transition flashes on a theme switch); the quickLong curve matches legacy timing.
  const morphTransition = animateMorph
    ? ['min-width', 'max-width', 'min-height', 'padding-left', 'padding-right', 'padding-bottom']
        .map((prop) => `${prop} ${SPORE_ANIMATION_CURVE_CSS.quickLong}`)
        .join(', ')
    : undefined
  const morphSettled = useMorphSettled({ isTerminal, animateMorph })

  return (
    <Flex
      style={{ transition: morphTransition }}
      // Every animated property must have a LENGTH at both endpoints: a CSS transition cannot
      // interpolate from an unset/auto value, so `undefined` endpoints would snap instead of
      // glide — the whole morph rides this wrapper's min-width.
      maxWidth={isTerminal ? '100vw' : `calc(100vw - ${2 * APP_BODY_MOBILE_GUTTER_PX}px)`}
      minWidth={isTerminal ? '100vw' : 0}
      minHeight={isTerminal ? `calc(100dvh - ${headerHeight}px)` : 0}
      px={isTerminal ? TERMINAL_GUTTER : '$none'}
      pb={isTerminal ? '$spacing24' : '$none'}
    >
      <Flex
        row
        alignItems={isTerminal ? 'stretch' : 'flex-start'}
        gap={isTerminal ? TERMINAL_GUTTER : undefined}
        minHeight={isTerminal ? 420 : undefined}
        width={isTerminal ? '100%' : undefined}
        maxWidth={isTerminal ? TERMINAL_CONTENT_MAX_WIDTH : undefined}
        alignSelf={isTerminal ? 'center' : undefined}
      >
        {/* Conditional siblings keep positional slots ({cond && ...} renders a hole, not a
            reorder), so the SwapModuleWrapper child below never changes tree position. */}
        {!isTerminal && nonTerminalChartAnimator}
        <MarginMorphProvider morphSettled={morphSettled}>
          {isTerminal && chartPane ? (
            <Flex flex={1} minWidth={0} className={animateMorph ? ENTER_PRESET_CLASSES.fadeIn : undefined}>
              {chartPane}
            </Flex>
          ) : null}
        </MarginMorphProvider>
        {children}
        {!isTerminal && nonTerminalSidePanel}
      </Flex>
      {isTerminal && positionsTable ? (
        <Flex
          mt="$spacing36"
          width="100%"
          maxWidth={TERMINAL_CONTENT_MAX_WIDTH}
          alignSelf="center"
          // Stagger reveal: rise + fade from below, delayed 150ms to match the legacy
          // '300msDelayed' curve. `both` fill holds the hidden `from` frame through the delay
          // (the -below keyframe has no fill of its own) — otherwise it flashes visible for
          // 150ms before starting (FormWrapper precedent).
          //
          // On `animateMorph`, not just reduced motion: this staggers BEHIND the chart's fade above,
          // which is gated on it. On a cold deep-link to /margin (`hasInteracted` false) the chart
          // paints instantly while `both` fill would hold the table hidden for 150ms — a stagger
          // behind an entrance that never happened.
          className={
            animateMorph
              ? `${ENTER_PRESET_CLASSES.fadeInBelow} [animation-delay:150ms] [animation-fill-mode:both]`
              : undefined
          }
        >
          {positionsTable}
        </Flex>
      ) : null}
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
