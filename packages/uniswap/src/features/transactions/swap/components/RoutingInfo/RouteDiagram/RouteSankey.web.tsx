import { Flex } from '@universe/mycelium'
import { useExtractedTokenColor, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { RouteSankeyProps } from 'uniswap/src/features/transactions/swap/components/RoutingInfo/RouteDiagram/RouteSankey'
import {
  BPS_PER_PERCENT,
  type HoverContent,
  type HoverState,
  LINK_HOVER_CARD_WIDTH,
  NODE_HOVER_CARD_WIDTH,
  RouteSankeyHoverCard,
} from 'uniswap/src/features/transactions/swap/components/RoutingInfo/RouteDiagram/RouteSankeyHoverCard'
import {
  getRouteDiagramPoolHref,
  getRouteDiagramTokenHref,
  type RouteDiagramNode,
} from 'uniswap/src/utils/routingDiagram/routeGraph/buildRouteDiagram'
import {
  layoutRouteSankey,
  type PositionedRouteLink,
  type PositionedRouteNode,
} from 'uniswap/src/utils/routingDiagram/routeGraph/layoutRouteSankey'
import { useContainerWidth } from 'utilities/src/react/useContainerWidth'

/** A token is a square-ended divider in its colour, spanning exactly its ribbons. */
const NODE_BAR_WIDTH = 8
/** Pointer target around the divider, so a token is as easy to hover and click as a wider bar. */
const NODE_HIT_WIDTH = 12
/** Text labels need two lines of room between stacked bars; logos only need a gap scaled to their size. */
const NODE_GAP_TEXT = 30
/** Gap between stacked bars as a share of the logo's diameter: 14px next to the modal's 18px logos. */
const NODE_GAP_PER_ICON_PX = 14 / 18
const LABEL_INSIDE_GAP = 10
/** Room above and below the chart for a two-line label placed outside its bar. */
const LABEL_BLOCK_HEIGHT = 30
const TEXT_MARGIN = { top: 36, right: 14, bottom: 36, left: 14 }
const ICON_MARGIN_Y = 10
/** Thin ribbons get a wider invisible stroke so they stay easy to hover. */
const MIN_RIBBON_HIT_WIDTH = 8
/**
 * Hairline flows are drawn at least this wide so they stay visible; the layout keeps their true width. Hover only
 * changes opacity: widening the highlighted ribbons would push them into their neighbours and past the bar's ends.
 */
const MIN_RIBBON_VISIBLE_WIDTH = 1.5
/** Neighbouring ribbons are drawn this much thinner than their flow so each pool reads as its own band. */
const RIBBON_SEAM_WIDTH = 2
/** The whole trade's flow is at most this share of the chart height; simple routes render shorter instead of as solid blocks. */
const MAX_FLOW_HEIGHT_SHARE = 0.5
/** A route with side routes curving around the input-to-output band gets a thicker band and a taller chart. */
const MAX_MULTI_HOP_FLOW_HEIGHT_SHARE = 0.62
const RIBBON_OPACITY = 0.6
/** Side flows under this share read as secondary to the trunk. */
const THIN_RIBBON_SHARE_BPS = 500
const RIBBON_OPACITY_THIN = 0.45
const RIBBON_OPACITY_HOVERED = 0.9
/** While a bar is hovered, ribbons not touching it fade to this share of their resting opacity. */
const RIBBON_DIM_FACTOR = 0.35
/** Ribbon brighten lands fast and releases softer, asymmetric by design. */
const RIBBON_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const RIBBON_TRANSITION_MS = 150
const RIBBON_TRANSITION_HOVERED_MS = 80
const HOVER_CARD_OFFSET = 12
/** Approximate card heights, so a card near the bottom edge flips above the cursor. */
const LINK_HOVER_CARD_HEIGHT = 80
const NODE_HOVER_CARD_HEIGHT = 32
/** Grace period so the pointer can travel from a ribbon into its (interactive) card. */
const HOVER_CLOSE_DELAY_MS = 150

type Emphasis = 'highlight' | 'dim' | 'normal'
type LabelPlacement = 'inside-right' | 'inside-left' | 'above' | 'below'

function getEmphasis({ link, hover }: { link: PositionedRouteLink; hover: HoverContent | undefined }): Emphasis {
  if (hover?.kind === 'link') {
    return hover.link.id === link.id ? 'highlight' : 'normal'
  }
  if (hover?.kind === 'node') {
    return link.source === hover.node.id || link.target === hover.node.id ? 'highlight' : 'dim'
  }
  return 'normal'
}

/**
 * Where a text label sits: the outer columns label inward; a middle bar labels above or below when it is the
 * top or bottom of its column and the label fits there, else to its left.
 */
function getLabelPlacement({
  node,
  columnCount,
  columnSize,
  positionInColumn,
  height,
}: {
  node: PositionedRouteNode
  columnCount: number
  columnSize: number
  positionInColumn: number
  height: number
}): LabelPlacement {
  if (node.column === 0) {
    return 'inside-right'
  }
  if (node.column === columnCount - 1) {
    return 'inside-left'
  }
  if ((columnSize <= 1 || positionInColumn === 0) && node.y0 >= LABEL_BLOCK_HEIGHT) {
    return 'above'
  }
  if (positionInColumn === columnSize - 1 && node.y1 + LABEL_BLOCK_HEIGHT <= height) {
    return 'below'
  }
  return 'inside-left'
}

/**
 * Samples one token's accent from its logo (or derives one from its ticker when it has none) and reports it up,
 * since the hook can only run once per component and the diagram has a variable number of tokens.
 */
function TokenColorProbe({
  node,
  logoUrl,
  onColor,
}: {
  node: RouteDiagramNode
  logoUrl: string | undefined
  onColor: (tokenKey: string, color: string) => void
}): null {
  const colors = useSporeColors()
  const { tokenColor } = useExtractedTokenColor({
    imageUrl: logoUrl,
    tokenName: node.symbol,
    backgroundColor: colors.surface1.val,
    defaultColor: colors.neutral3.val,
  })
  useEffect(() => {
    if (tokenColor) {
      onColor(node.tokenKey, tokenColor)
    }
  }, [node.tokenKey, tokenColor, onColor])
  return null
}

export function RouteSankey({
  diagram,
  chainId,
  height,
  iconSize,
  logoUrlByTokenKey,
  onNavigate,
}: RouteSankeyProps): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { formatPercent } = useLocalizationContext()
  const { navigateToTokenDetails, navigateToPoolDetails } = useUniswapContext()
  const idPrefix = useId().replace(/:/g, '')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const width = useContainerWidth(wrapperRef)

  // Logo nodes carry no persistent text, so the chart runs edge to edge and the margins only clear the logo's
  // overhang past the bar; text nodes need room for labels placed above, below or beside their bars.
  const iconMode = diagram.nodes.some((node) => logoUrlByTokenKey.has(node.tokenKey))
  const margin = useMemo(() => {
    if (!iconMode) {
      return TEXT_MARGIN
    }
    const side = Math.round((iconSize - NODE_BAR_WIDTH) / 2) + LABEL_INSIDE_GAP
    return { top: ICON_MARGIN_Y, right: side, bottom: ICON_MARGIN_Y, left: side }
  }, [iconMode, iconSize])
  const innerHeight = height - margin.top - margin.bottom

  const layout = useMemo(
    () =>
      layoutRouteSankey({
        diagram,
        width: width - margin.left - margin.right,
        height: innerHeight,
        nodeWidth: NODE_BAR_WIDTH,
        nodePadding: iconMode ? Math.round(iconSize * NODE_GAP_PER_ICON_PX) : NODE_GAP_TEXT,
        maxFlowHeight: innerHeight * MAX_FLOW_HEIGHT_SHARE,
        maxMultiHopFlowHeight: innerHeight * MAX_MULTI_HOP_FLOW_HEIGHT_SHARE,
        markerSize: iconMode ? iconSize : 0,
      }),
    [diagram, width, innerHeight, margin, iconMode, iconSize],
  )
  const nodeById = useMemo(() => new Map(layout.nodes.map((node) => [node.id, node])), [layout.nodes])
  // Share of input value through each node, for its label and hover card.
  const shareByNodeId = useMemo(() => {
    const inflow = new Map<string, number>()
    const outflow = new Map<string, number>()
    for (const link of layout.links) {
      inflow.set(link.target, (inflow.get(link.target) ?? 0) + link.shareBps)
      outflow.set(link.source, (outflow.get(link.source) ?? 0) + link.shareBps)
    }
    return new Map(layout.nodes.map((node) => [node.id, Math.max(inflow.get(node.id) ?? 0, outflow.get(node.id) ?? 0)]))
  }, [layout])
  // Each bar's place in its column, top to bottom, for label placement.
  const columnSlotByNodeId = useMemo(() => {
    const byColumn = new Map<number, PositionedRouteNode[]>()
    for (const node of layout.nodes) {
      byColumn.set(node.column, [...(byColumn.get(node.column) ?? []), node])
    }
    const slots = new Map<string, { columnSize: number; positionInColumn: number }>()
    for (const column of byColumn.values()) {
      column
        .sort((a, b) => a.y0 - b.y0)
        .forEach((node, positionInColumn) => slots.set(node.id, { columnSize: column.length, positionInColumn }))
    }
    return slots
  }, [layout.nodes])

  const tokenNodes = useMemo(
    () => [...new Map(diagram.nodes.map((node) => [node.tokenKey, node])).values()],
    [diagram.nodes],
  )
  const [tokenColors, setTokenColors] = useState<ReadonlyMap<string, string>>(new Map())
  const onTokenColor = useCallback((tokenKey: string, color: string): void => {
    setTokenColors((prev) => (prev.get(tokenKey) === color ? prev : new Map(prev).set(tokenKey, color)))
  }, [])
  const colorOf = (tokenKey: string): string => tokenColors.get(tokenKey) ?? colors.neutral3.val

  const [hover, setHover] = useState<HoverState | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelClose = useCallback((): void => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])
  useEffect(() => cancelClose, [cancelClose])
  const hideHover = useCallback((): void => {
    cancelClose()
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null
      setHover(null)
    }, HOVER_CLOSE_DELAY_MS)
  }, [cancelClose])
  const showHover = useCallback(
    ({ content, clientX, clientY }: { content: HoverContent; clientX: number; clientY: number }): void => {
      cancelClose()
      const rect = wrapperRef.current?.getBoundingClientRect()
      if (!rect) {
        return
      }
      const isLink = content.kind === 'link'
      const cardWidth = isLink ? LINK_HOVER_CARD_WIDTH : NODE_HOVER_CARD_WIDTH
      const cardHeight = isLink ? LINK_HOVER_CARD_HEIGHT : NODE_HOVER_CARD_HEIGHT
      const rawX = clientX - rect.left + HOVER_CARD_OFFSET
      const rawY = clientY - rect.top + HOVER_CARD_OFFSET
      const flipY = rawY + cardHeight > rect.height
      setHover({
        content,
        x: Math.max(0, Math.min(rawX, rect.width - cardWidth)),
        y: flipY ? Math.max(0, rawY - cardHeight - 2 * HOVER_CARD_OFFSET) : rawY,
      })
    },
    [cancelClose],
  )

  // Plain click navigates in place like the rest of the app; a modifier click opens a tab, since SVG shapes
  // cannot carry the router's anchor.
  const navigate = ({ href, inPlace, event }: { href: string; inPlace: () => void; event: React.MouseEvent }): void => {
    cancelClose()
    setHover(null)
    if (event.metaKey || event.ctrlKey) {
      window.open(href, '_blank', 'noopener')
      return
    }
    inPlace()
    onNavigate?.()
  }

  const probes = tokenNodes.map((node) => (
    <TokenColorProbe
      key={node.tokenKey}
      node={node}
      logoUrl={logoUrlByTokenKey.get(node.tokenKey)}
      onColor={onTokenColor}
    />
  ))

  if (layout.nodes.length === 0) {
    return (
      <Flex ref={wrapperRef} width="100%" height={height}>
        {probes}
      </Flex>
    )
  }

  // Thickest first, so a thin ribbon is painted (and hoverable) on top of a wide one it crosses.
  const linksThickestFirst = [...layout.links].sort((a, b) => b.width - a.width)

  const renderLink = (link: PositionedRouteLink): JSX.Element | null => {
    const from = nodeById.get(link.source)
    const to = nodeById.get(link.target)
    if (!from || !to) {
      return null
    }
    const emphasis = getEmphasis({ link, hover: hover?.content })
    const restingOpacity = link.shareBps < THIN_RIBBON_SHARE_BPS ? RIBBON_OPACITY_THIN : RIBBON_OPACITY
    const opacity =
      emphasis === 'highlight'
        ? RIBBON_OPACITY_HOVERED
        : emphasis === 'dim'
          ? restingOpacity * RIBBON_DIM_FACTOR
          : restingOpacity
    const gradientId = `${idPrefix}-grad-${link.id.replace(/[^a-zA-Z0-9]/g, '-')}`
    const poolHref = getRouteDiagramPoolHref({ link, chainId })
    const poolAddress = link.poolAddress
    const onClick =
      poolHref && poolAddress
        ? (event: React.MouseEvent): void =>
            navigate({ href: poolHref, inPlace: () => navigateToPoolDetails({ poolId: poolAddress, chainId }), event })
        : undefined
    return (
      <g key={link.id}>
        <defs>
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1={link.sourceX}
            y1={0}
            x2={link.targetX}
            y2={0}
          >
            <stop offset="0%" stopColor={colorOf(from.tokenKey)} />
            <stop offset="100%" stopColor={colorOf(to.tokenKey)} />
          </linearGradient>
        </defs>
        <path
          d={link.path}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeOpacity={opacity}
          strokeWidth={Math.max(link.width - RIBBON_SEAM_WIDTH, MIN_RIBBON_VISIBLE_WIDTH)}
          style={{
            transition: `stroke-opacity ${emphasis === 'highlight' ? RIBBON_TRANSITION_HOVERED_MS : RIBBON_TRANSITION_MS}ms ${RIBBON_EASE}`,
            pointerEvents: 'none',
          }}
        />
        <path
          data-testid="route-sankey-ribbon"
          d={link.path}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(link.width, MIN_RIBBON_HIT_WIDTH)}
          style={{ cursor: onClick ? 'pointer' : 'default', pointerEvents: 'stroke' }}
          onMouseMove={(event): void => {
            if (hover?.content.kind !== 'link' || hover.content.link.id !== link.id) {
              showHover({ content: { kind: 'link', link, from, to }, clientX: event.clientX, clientY: event.clientY })
            } else {
              cancelClose()
            }
          }}
          onMouseLeave={hideHover}
          onClick={onClick}
        />
      </g>
    )
  }

  const renderNode = (node: PositionedRouteNode): JSX.Element => {
    const logoUrl = logoUrlByTokenKey.get(node.tokenKey)
    const shareBps = shareByNodeId.get(node.id) ?? 0
    const cx = (node.x0 + node.x1) / 2
    const cy = (node.y0 + node.y1) / 2
    const barHeight = Math.max(node.y1 - node.y0, 1)
    const onClick = (event: React.MouseEvent): void =>
      navigate({
        href: getRouteDiagramTokenHref({ node, chainId }),
        inPlace: () => navigateToTokenDetails(node.currencyId),
        event,
      })
    const onMouseEnter = (event: React.MouseEvent): void =>
      showHover({ content: { kind: 'node', node, shareBps }, clientX: event.clientX, clientY: event.clientY })
    const r = iconSize / 2
    const clipId = `${idPrefix}-clip-${node.id.replace(/[^a-zA-Z0-9]/g, '-')}`
    const slot = columnSlotByNodeId.get(node.id) ?? { columnSize: 1, positionInColumn: 0 }
    return (
      <g
        key={node.id}
        style={{ cursor: 'pointer' }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={hideHover}
        onClick={onClick}
      >
        <rect x={cx - NODE_HIT_WIDTH / 2} y={node.y0} width={NODE_HIT_WIDTH} height={barHeight} fill="transparent" />
        <rect x={node.x0} y={node.y0} width={node.x1 - node.x0} height={barHeight} fill={colorOf(node.tokenKey)} />
        {logoUrl ? (
          <>
            <defs>
              <clipPath id={clipId}>
                <circle cx={cx} cy={cy} r={r} />
              </clipPath>
            </defs>
            <image
              href={logoUrl}
              x={cx - r}
              y={cy - r}
              width={iconSize}
              height={iconSize}
              clipPath={`url(#${clipId})`}
              preserveAspectRatio="xMidYMid slice"
            />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.surface1.val} strokeWidth={1} />
          </>
        ) : (
          <NodeTextLabel
            node={node}
            value={formatPercent(shareBps / BPS_PER_PERCENT, 1)}
            placement={getLabelPlacement({ node, columnCount: layout.columnCount, height: layout.height, ...slot })}
          />
        )}
      </g>
    )
  }

  return (
    <Flex ref={wrapperRef} position="relative" width="100%">
      {probes}
      <svg
        width={width}
        height={layout.height + margin.top + margin.bottom}
        style={{ display: 'block', overflow: 'visible' }}
        role="img"
        aria-label={t('swap.routing.guidestar.diagramLabel')}
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          <g>{linksThickestFirst.map(renderLink)}</g>
          <g>{layout.nodes.map(renderNode)}</g>
        </g>
      </svg>
      {hover && (
        <RouteSankeyHoverCard
          hover={hover}
          logoUrlByTokenKey={logoUrlByTokenKey}
          onEnter={cancelClose}
          onLeave={hideHover}
        />
      )}
    </Flex>
  )
}

function NodeTextLabel({
  node,
  value,
  placement,
}: {
  node: PositionedRouteNode
  value: string
  placement: LabelPlacement
}): JSX.Element {
  const colors = useSporeColors()
  const sideAligned = placement === 'inside-right' || placement === 'inside-left'
  const midY = (node.y0 + node.y1) / 2
  const midX = (node.x0 + node.x1) / 2
  const label =
    placement === 'inside-right'
      ? { x: node.x1 + LABEL_INSIDE_GAP, y: midY, anchor: 'start' as const }
      : placement === 'inside-left'
        ? { x: node.x0 - LABEL_INSIDE_GAP, y: midY, anchor: 'end' as const }
        : placement === 'above'
          ? { x: midX, y: node.y0 - 6, anchor: 'middle' as const }
          : { x: midX, y: node.y1 + 6, anchor: 'middle' as const }
  const line1Dy = sideAligned ? -2 : placement === 'above' ? -12 : 10
  const line2Dy = sideAligned ? 12 : placement === 'above' ? 0 : 22
  return (
    <>
      <text
        x={label.x}
        y={label.y + line1Dy}
        textAnchor={label.anchor}
        fill={colors.neutral1.val}
        style={{ fontSize: 12, fontWeight: 600 }}
      >
        {node.symbol}
      </text>
      <text
        x={label.x}
        y={label.y + line2Dy}
        textAnchor={label.anchor}
        fill={colors.neutral2.val}
        style={{ fontSize: 11, fontWeight: 500 }}
      >
        {value}
      </text>
    </>
  )
}
