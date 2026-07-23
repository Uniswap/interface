import { useLayoutEffect, useRef, useState } from 'react'
import { Flex } from 'ui/src'
import {
  EXPANDABLE_ASSET_ROW_HEIGHT_TRANSITION_MS,
  EXPANDABLE_ASSET_SHELL_HEADER_GAP_PX,
} from 'uniswap/src/features/expandableAsset/expandableAssetLayout'
import { ExpandableSearchRow } from 'uniswap/src/features/expandableAsset/ExpandableSearchRow'
import type { ExpandableSearchRowContainerProps } from 'uniswap/src/features/expandableAsset/ExpandableSearchRowContainer'

const REVEAL_TRANSITION = `height ${EXPANDABLE_ASSET_ROW_HEIGHT_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`

/**
 * Web: animate the issuer-panel reveal on expand/collapse. A clip wrapper animates its height between 0 and the
 * panel height; the search list's `ResizeObserver` (`useRowHeightObserver`) reports each intermediate height to
 * react-window, so the virtualized row grows in sync. The row must keep a stable key across toggle
 * (measurementKey/itemKey exclude `expanded`) or it would remount and snap instead of animating.
 */
export function ExpandableSearchRowContainer({
  isExpanded,
  canExpand,
  onToggle,
  onParentPress,
  onParentLongPress,
  parentHref,
  header,
  issuerPanel,
  issuerPanelHeightPx,
  focusedRowControl,
  testID,
}: ExpandableSearchRowContainerProps): JSX.Element {
  const shouldExpand = canExpand && isExpanded
  // Include the parent↔panel gap in the animated height so it reveals with the panel (no discrete gap pop).
  const expandedRevealPx = EXPANDABLE_ASSET_SHELL_HEADER_GAP_PX + issuerPanelHeightPx

  const [animatedHeightPx, setAnimatedHeightPx] = useState(shouldExpand ? expandedRevealPx : 0)
  const [shouldRenderPanel, setShouldRenderPanel] = useState(shouldExpand)
  const shouldExpandRef = useRef(shouldExpand)
  // Mirror the latest height so the collapse branch can read it without re-running the effect every frame.
  const animatedHeightRef = useRef(animatedHeightPx)
  animatedHeightRef.current = animatedHeightPx

  // Animate only on a real expand/collapse transition, not on (re)mount: a virtualized row can mount
  // already-expanded (scrolled back into view) and must appear settled, not replay the reveal. Comparing the
  // previous value (rather than a first-render flag) stays correct under StrictMode's double-invoke.
  useLayoutEffect(() => {
    const wasExpanded = shouldExpandRef.current
    shouldExpandRef.current = shouldExpand

    if (wasExpanded === shouldExpand) {
      setAnimatedHeightPx(shouldExpand ? expandedRevealPx : 0)
      return undefined
    }

    if (shouldExpand) {
      // Mount the panel at height 0 in this pre-paint commit, then grow to full on the next frames, so the first
      // painted frame is 0 (a post-paint mount could race the height update and snap straight to full).
      setShouldRenderPanel(true)
      setAnimatedHeightPx(0)
      let frame2 = 0
      const frame1 = requestAnimationFrame(() => {
        frame2 = requestAnimationFrame(() => setAnimatedHeightPx(expandedRevealPx))
      })
      return () => {
        cancelAnimationFrame(frame1)
        cancelAnimationFrame(frame2)
      }
    }

    // Collapse: animate to 0; the panel unmounts on transitionEnd, so the shell persists through the animation.
    // If the height is already 0 (a fast expand→collapse before the reveal painted), no transition fires, so
    // unmount directly rather than waiting for a transitionEnd that never comes.
    if (animatedHeightRef.current === 0) {
      setShouldRenderPanel(false)
      return undefined
    }
    setAnimatedHeightPx(0)
    return undefined
  }, [shouldExpand, expandedRevealPx])

  const showShell = shouldExpand || shouldRenderPanel

  const panelSlot = shouldRenderPanel ? (
    // Clip the panel to the animated height so it never spills over the rows below. The settled height equals
    // the panel's exact (computed) height, so nothing is cropped at rest.
    // oxlint-disable-next-line eslint-plugin-react(forbid-elements) -- raw div needed for a CSS height-reveal clip
    <div
      aria-hidden={!shouldExpand}
      // `inert` while collapsing removes the still-mounted issuer-row buttons from the tab order mid-animation.
      {...(!shouldExpand ? { inert: true } : {})}
      style={{
        boxSizing: 'border-box',
        height: animatedHeightPx,
        overflow: 'hidden',
        pointerEvents: shouldExpand ? 'auto' : 'none',
        transition: REVEAL_TRANSITION,
        width: '100%',
      }}
      onTransitionEnd={(event) => {
        if (event.propertyName === 'height' && event.currentTarget === event.target && !shouldExpand) {
          setShouldRenderPanel(false)
        }
      }}
    >
      <Flex pt={EXPANDABLE_ASSET_SHELL_HEADER_GAP_PX} width="100%">
        {issuerPanel}
      </Flex>
    </div>
  ) : null

  return (
    <ExpandableSearchRow
      showShell={showShell}
      canExpand={canExpand}
      isExpanded={isExpanded}
      header={header}
      panelSlot={panelSlot}
      focusedRowControl={focusedRowControl}
      testID={testID}
      modifierPressHref={parentHref}
      onToggle={onToggle}
      onParentPress={onParentPress}
      onParentLongPress={onParentLongPress}
    />
  )
}
