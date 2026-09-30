import { Flex, TouchableArea } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { useEffect, useLayoutEffect, useState } from 'react'
import {
  EXPANDABLE_ASSET_ROW_HEIGHT_TRANSITION_MS,
  EXPANDABLE_ASSET_SHELL_HEADER_GAP_PX,
  EXPANDABLE_ASSET_TABLE_SHELL_PADDING_PX,
} from 'uniswap/src/features/expandableAsset/expandableAssetLayout'
import { useTableRowContentMinWidthPx } from '~/components/Table/TableSizeProvider'
import { IssuerTableRowHoverProvider } from '~/pages/Explore/rwa/expandable/IssuerTableRowHoverProvider'

const EXPANDABLE_TABLE_ROW_HEIGHT_TRANSITION = `height ${EXPANDABLE_ASSET_ROW_HEIGHT_TRANSITION_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`

export type ExpandableTableRowContainerProps = {
  isExpanded: boolean
  /** Issuer panel height when collapsed (typically 0). */
  collapsedIssuerHeightPx: number
  /** Issuer panel height when fully expanded (`getExpandableIssuerPanelHeightPx`). */
  expandedIssuerHeightPx: number
  /** RWA Explore only: widen the shell by its horizontal padding so the card matches the All table row width.
   *  Disable when columns flex-grow (e.g. portfolio tokens) — otherwise the shell overflows the header/flat rows
   *  by the padding amount whenever the table scrolls horizontally. */
  extendShellBeyondRowContent?: boolean
  onToggle: () => void
  parentRow: ReactNode
  issuerPanel: ReactNode
}

/** Single table row surface (`$surface2`) that grows in place to reveal issuer sub-rows inside it. */
export function ExpandableTableRowContainer({
  isExpanded,
  collapsedIssuerHeightPx,
  expandedIssuerHeightPx,
  extendShellBeyondRowContent = true,
  onToggle,
  parentRow,
  issuerPanel,
}: ExpandableTableRowContainerProps): JSX.Element {
  const targetIssuerHeightPx = isExpanded ? expandedIssuerHeightPx : collapsedIssuerHeightPx
  const [animatedIssuerHeightPx, setAnimatedIssuerHeightPx] = useState(targetIssuerHeightPx)
  const [retainIssuerPanel, setRetainIssuerPanel] = useState(isExpanded)
  const [isIssuerTransitioning, setIsIssuerTransitioning] = useState(false)

  // The clip div must mount in the SAME commit that flips `isExpanded`, so it gets a painted frame at the
  // collapsed height before the double-rAF below applies the expanded height. Mounting it from a passive
  // effect (the old `shouldRenderIssuerPanel` flow) raced that rAF pair: under load the panel subtree
  // committed after the expanded height was already set, so the div mounted at full height and the entry
  // transition never fired. `retainIssuerPanel` now only keeps the panel mounted through the collapse
  // transition (unset on transitionend) so the reveal can animate shut before unmount.
  const shouldRenderIssuerPanel = isExpanded || retainIssuerPanel

  const rowContentMinWidthPx = useTableRowContentMinWidthPx()

  /** Match expanded card outer width at every breakpoint (column sum + shell horizontal padding when extended). */
  const shellMinWidthPx =
    rowContentMinWidthPx + (extendShellBeyondRowContent ? EXPANDABLE_ASSET_TABLE_SHELL_PADDING_PX * 2 : 0)
  const shellHorizontalBleedPx = EXPANDABLE_ASSET_TABLE_SHELL_PADDING_PX * 2

  useLayoutEffect(() => {
    let frame1 = 0
    let frame2 = 0

    if (isExpanded) {
      setAnimatedIssuerHeightPx(collapsedIssuerHeightPx)
      frame1 = requestAnimationFrame(() => {
        frame2 = requestAnimationFrame(() => {
          setAnimatedIssuerHeightPx(expandedIssuerHeightPx)
        })
      })
      return () => {
        cancelAnimationFrame(frame1)
        cancelAnimationFrame(frame2)
      }
    }

    setAnimatedIssuerHeightPx(collapsedIssuerHeightPx)
    return undefined
  }, [isExpanded, collapsedIssuerHeightPx, expandedIssuerHeightPx])

  useEffect(() => {
    if (isExpanded) {
      setRetainIssuerPanel(true)
      return undefined
    }
    if (!retainIssuerPanel) {
      return undefined
    }
    // Fallback unmount: a row toggled shut before the double-rAF above applies the expanded height
    // never changes the clip height, so no transition runs and transitionend never fires — without
    // this, `retainIssuerPanel` would stay true and the zero-height panel would keep the shell's
    // flex gap. transitionend still unmounts promptly when a collapse transition does run; this
    // timer only catches the no-transition (and any cancelled-transition) paths.
    const fallbackTimer = setTimeout(() => setRetainIssuerPanel(false), EXPANDABLE_ASSET_ROW_HEIGHT_TRANSITION_MS + 150)
    return () => clearTimeout(fallbackTimer)
  }, [isExpanded, retainIssuerPanel])

  const issuerClipOverflow = isExpanded && !isIssuerTransitioning ? 'visible' : 'hidden'

  return (
    <TouchableArea minWidth={shellMinWidthPx} pressStyle={{ scale: 1 }} width="100%" onPress={onToggle}>
      <Flex
        backgroundColor={isExpanded ? '$surface2' : '$surface1'}
        borderRadius="$rounded16"
        gap={EXPANDABLE_ASSET_SHELL_HEADER_GAP_PX}
        minWidth={shellMinWidthPx}
        p="$spacing4"
        width="100%"
      >
        <IssuerTableRowHoverProvider hoverStyle={isExpanded ? { backgroundColor: '$surface2Hovered' } : undefined}>
          <Flex mx={-EXPANDABLE_ASSET_TABLE_SHELL_PADDING_PX} width={`calc(100% + ${shellHorizontalBleedPx}px)`}>
            {parentRow}
          </Flex>
        </IssuerTableRowHoverProvider>
        {shouldRenderIssuerPanel ? (
          /* oxlint-disable-next-line react/forbid-elements -- issuer reveal clip inside unified shell */
          <div
            aria-hidden={!isExpanded}
            style={{
              boxSizing: 'border-box',
              height: animatedIssuerHeightPx,
              overflow: issuerClipOverflow,
              pointerEvents: isExpanded ? 'auto' : 'none',
              transition: EXPANDABLE_TABLE_ROW_HEIGHT_TRANSITION,
              width: '100%',
            }}
            onTransitionStart={(event) => {
              if (event.propertyName !== 'height' || event.currentTarget !== event.target) {
                return
              }
              setIsIssuerTransitioning(true)
            }}
            onTransitionEnd={(event) => {
              if (event.propertyName !== 'height' || event.currentTarget !== event.target) {
                return
              }
              setIsIssuerTransitioning(false)
              if (!isExpanded) {
                setRetainIssuerPanel(false)
              }
            }}
          >
            <Flex minWidth="100%" width="min-content">
              {issuerPanel}
            </Flex>
          </div>
        ) : null}
      </Flex>
    </TouchableArea>
  )
}
