import { sankey } from 'd3-sankey'
import type {
  RouteDiagram,
  RouteDiagramLink,
  RouteDiagramNode,
} from 'uniswap/src/utils/routingDiagram/routeGraph/buildRouteDiagram'
import {
  type LayoutLinkDatum,
  type LayoutNodeDatum,
  type LinkDatum,
  measureChainEnds,
  type NodeDatum,
  idealCentre,
  placeColumn,
  SLOT_GAP,
} from 'uniswap/src/utils/routingDiagram/routeGraph/routeSankeyColumnPlacement'

export interface PositionedRouteNode extends RouteDiagramNode {
  x0: number
  x1: number
  y0: number
  y1: number
  /** Column, from 0 at the input token. */
  column: number
}

export interface PositionedRouteLink extends RouteDiagramLink {
  /** Ribbon thickness; the path is a centreline meant to be stroked at this width. */
  width: number
  path: string
  sourceX: number
  targetX: number
}

export interface RouteSankeyLayout {
  nodes: PositionedRouteNode[]
  links: PositionedRouteLink[]
  columnCount: number
  /** Height the layout actually uses: at most the requested height, less when `maxFlowHeight` caps it. */
  height: number
}

const EMPTY_LAYOUT: RouteSankeyLayout = { nodes: [], links: [], columnCount: 0, height: 0 }
/** Share of the height the gaps in the busiest column may take, so dense routes keep visible bars. */
const MAX_PADDING_SHARE = 0.4
/** Rounds of re-placing each column against the ribbons' current ends; the positions settle within a few. */
const PLACEMENT_ROUNDS = 3

/** Longest-path depth from the input, with every token that has no outgoing pool pushed to the last column. */
function computeColumns(diagram: RouteDiagram): Map<string, number> {
  const incoming = new Map<string, string[]>()
  const hasOutgoing = new Set<string>()
  for (const link of diagram.links) {
    incoming.set(link.target, [...(incoming.get(link.target) ?? []), link.source])
    hasOutgoing.add(link.source)
  }
  const depth = new Map<string, number>()
  const visiting = new Set<string>()
  const depthOf = (id: string): number => {
    const known = depth.get(id)
    if (known !== undefined) {
      return known
    }
    // The Trading API guarantees an acyclic graph; this only keeps a malformed one from recursing forever.
    if (visiting.has(id)) {
      return 0
    }
    visiting.add(id)
    const value = Math.max(0, ...(incoming.get(id) ?? []).map((source) => depthOf(source) + 1))
    visiting.delete(id)
    depth.set(id, value)
    return value
  }
  const maxDepth = Math.max(0, ...diagram.nodes.map((node) => depthOf(node.id)))
  return new Map(diagram.nodes.map((node) => [node.id, hasOutgoing.has(node.id) ? depthOf(node.id) : maxDepth]))
}

function passThroughId({ link, column }: { link: RouteDiagramLink; column: number }): string {
  // Pools between the same two bars share one slot per column, so they stay a bundle as they pass.
  return `pass:${link.source}>${link.target}@${column}`
}

/** Splits every link that skips columns into legs through a pass-through slot in each column it crosses. */
function buildLayoutGraph({ diagram, columns }: { diagram: RouteDiagram; columns: Map<string, number> }): {
  nodes: LayoutNodeDatum[]
  links: LayoutLinkDatum[]
} {
  const nodes = new Map<string, LayoutNodeDatum>(
    diagram.nodes.map((node) => [node.id, { id: node.id, column: columns.get(node.id) ?? 0, isSlot: false }]),
  )
  const links: LayoutLinkDatum[] = []
  for (const link of diagram.links) {
    const from = columns.get(link.source) ?? 0
    const to = columns.get(link.target) ?? from + 1
    let previous = link.source
    let leg = 0
    for (let column = from + 1; column < to; column++) {
      const id = passThroughId({ link, column })
      nodes.set(id, { id, column, isSlot: true })
      links.push({ linkId: link.id, leg, source: previous, target: id, value: link.shareBps })
      previous = id
      leg++
    }
    links.push({ linkId: link.id, leg, source: previous, target: link.target, value: link.shareBps })
  }
  return { nodes: [...nodes.values()], links }
}

interface ColumnStats {
  bars: number
  slots: number
  flow: number
}

function measureColumns(graph: { nodes: LayoutNodeDatum[]; links: LayoutLinkDatum[] }): Map<number, ColumnStats> {
  const inflow = new Map<string, number>()
  const outflow = new Map<string, number>()
  for (const link of graph.links) {
    inflow.set(link.target, (inflow.get(link.target) ?? 0) + link.value)
    outflow.set(link.source, (outflow.get(link.source) ?? 0) + link.value)
  }
  const columns = new Map<number, ColumnStats>()
  for (const node of graph.nodes) {
    const column = columns.get(node.column) ?? { bars: 0, slots: 0, flow: 0 }
    column[node.isSlot ? 'slots' : 'bars'] += 1
    column.flow += Math.max(inflow.get(node.id) ?? 0, outflow.get(node.id) ?? 0)
    columns.set(node.column, column)
  }
  return columns
}

/** Room a column's gaps take at the least: the full padding only between two bars. */
function minColumnGaps({
  column,
  padding,
  slotGap,
}: {
  column: ColumnStats
  padding: number
  slotGap: number
}): number {
  if (column.bars === 0) {
    return Math.max(column.slots - 1, 0) * slotGap
  }
  return (column.bars - 1) * padding + column.slots * slotGap
}

/**
 * A stroked centreline from the source bar through each slot's centre to the target bar: one smooth curve, level
 * where it meets a bar and wherever it turns, so a ribbon that skips columns doesn't wiggle at every one.
 */
function linkPath(legs: LinkDatum[]): string {
  const first = legs[0]
  const last = legs[legs.length - 1]
  if (!first || !last) {
    return ''
  }
  const points: [number, number][] = [[(first.source as NodeDatum).x1 ?? 0, first.y0 ?? 0]]
  for (let index = 1; index < legs.length; index++) {
    const slot = legs[index]?.source as NodeDatum
    const y = ((legs[index - 1]?.y1 ?? 0) + (legs[index]?.y0 ?? 0)) / 2
    points.push([((slot.x0 ?? 0) + (slot.x1 ?? 0)) / 2, y])
  }
  points.push([(last.target as NodeDatum).x0 ?? 0, last.y1 ?? 0])

  // Monotone tangents (Fritsch-Carlson): level at both ends and at a turn, never overshooting a slot.
  const secants = points.slice(1).map(([x, y], index) => {
    const [px, py] = points[index] ?? [0, 0]
    return x > px ? (y - py) / (x - px) : 0
  })
  const tangents = points.map((_, index) => {
    const before = secants[index - 1]
    const after = secants[index]
    if (before === undefined || after === undefined || before * after <= 0) {
      return 0
    }
    return (2 * before * after) / (before + after)
  })
  let path = `M${points[0]?.[0]},${points[0]?.[1]}`
  for (let index = 1; index < points.length; index++) {
    const [x0, y0] = points[index - 1] ?? [0, 0]
    const [x1, y1] = points[index] ?? [0, 0]
    const third = (x1 - x0) / 3
    const c0 = y0 + (tangents[index - 1] ?? 0) * third
    const c1 = y1 - (tangents[index] ?? 0) * third
    path += `C${x0 + third},${c0} ${x1 - third},${c1} ${x1},${y1}`
  }
  return path
}

/**
 * Positions a route diagram: d3-sankey for the columns, bar order and sizes (by share of input value), then each
 * column re-packed with tighter gaps.
 *
 * `maxFlowHeight` caps the thickness of the whole trade's flow, so the input and output bars sit on one centred
 * band that stops short of the chart edges. When a hop column stacks more than one thing, so routes curve around
 * that band, `maxMultiHopFlowHeight` caps it instead: those charts get a thicker band than a single path or a
 * direct split. A ribbon that skips a column reserves a slot there, so the smaller routes curve above and below the
 * band rather than through a bar. Slots sit on the straight line between their ribbon's ends and bars where their
 * own ribbons are flattest, a small gap apart (the full padding only between two bars, and room for a `markerSize`
 * logo on a bar thinner than it); the chart is cropped to the result, up to `height`.
 */
export function layoutRouteSankey({
  diagram,
  width,
  height,
  nodeWidth,
  nodePadding,
  maxFlowHeight,
  maxMultiHopFlowHeight,
  markerSize = 0,
}: {
  diagram: RouteDiagram
  width: number
  height: number
  nodeWidth: number
  nodePadding: number
  maxFlowHeight?: number
  maxMultiHopFlowHeight?: number
  /** Diameter of the logo centred on each bar, 0 for none. */
  markerSize?: number
}): RouteSankeyLayout {
  if (width <= 0 || height <= 0 || diagram.links.length === 0) {
    return EMPTY_LAYOUT
  }
  const columns = computeColumns(diagram)
  const graph = buildLayoutGraph({ diagram, columns })
  const columnStats = [...measureColumns(graph).entries()]
  const busiestBars = Math.max(...columnStats.map(([, column]) => column.bars))
  const padding =
    busiestBars > 1 ? Math.min(nodePadding, (height * MAX_PADDING_SHARE) / (busiestBars - 1)) : nodePadding
  const slotGap = Math.min(SLOT_GAP, padding)

  // Scale the flow so the input bar is maxFlowHeight tall, or less when the busiest column would not fit.
  const inputFlow = columnStats.find(([index]) => index === 0)?.[1].flow ?? 0
  const lastStatsColumn = Math.max(...columnStats.map(([index]) => index))
  const hasSideRoutes = columnStats.some(
    ([index, column]) => index !== 0 && index !== lastStatsColumn && column.bars + column.slots > 1,
  )
  const flowHeight = Math.min((hasSideRoutes ? maxMultiHopFlowHeight : undefined) ?? maxFlowHeight ?? height, height)
  const pxPerValue = Math.min(
    inputFlow > 0 ? flowHeight / inputFlow : 0,
    ...columnStats.map(([, column]) =>
      column.flow > 0 ? Math.max(height - minColumnGaps({ column, padding, slotGap }), 0) / column.flow : Infinity,
    ),
  )
  // d3 spaces every node by the full padding; this extent leaves it at exactly that scale, and the columns are
  // re-packed tighter afterwards.
  const d3Height = Math.max(
    ...columnStats.map(([, column]) => column.flow * pxPerValue + (column.bars + column.slots - 1) * padding),
  )

  const generator = sankey<LayoutNodeDatum, LayoutLinkDatum>()
    .nodeId((node) => node.id)
    .nodeAlign((node) => node.column)
    .nodeWidth(nodeWidth)
    .nodePadding(padding)
    .extent([
      [0, 0],
      [width, d3Height],
    ])
  // d3-sankey mutates its input, so it gets the fresh graph built above.
  const laidOut = generator(graph)

  // The input and output bars share one band, and the routes around them curve out past its top and bottom.
  const lastColumn = Math.max(...laidOut.nodes.map((node) => node.column))
  const nodesByColumn = new Map<number, NodeDatum[]>()
  for (const node of laidOut.nodes) {
    nodesByColumn.set(node.column, [...(nodesByColumn.get(node.column) ?? []), node])
  }
  for (const column of [0, lastColumn]) {
    const ends = nodesByColumn.get(column) ?? []
    const end = ends[0]
    if (ends.length === 1 && end) {
      const barHeight = (end.y1 ?? 0) - (end.y0 ?? 0)
      end.y0 = (d3Height - barHeight) / 2
      end.y1 = end.y0 + barHeight
    }
  }
  generator.update(laidOut)

  const legsByLinkId = new Map<string, LinkDatum[]>()
  for (const leg of laidOut.links) {
    legsByLinkId.set(leg.linkId, [...(legsByLinkId.get(leg.linkId) ?? []), leg])
  }
  for (const legs of legsByLinkId.values()) {
    legs.sort((a, b) => a.leg - b.leg)
  }

  for (let round = 0; round < PLACEMENT_ROUNDS; round++) {
    const chainEnds = measureChainEnds(legsByLinkId)
    for (const [column, nodes] of nodesByColumn) {
      if (column === 0 || column === lastColumn) {
        continue
      }
      const ordered = [...nodes].sort((a, b) => (a.y0 ?? 0) + (a.y1 ?? 0) - ((b.y0 ?? 0) + (b.y1 ?? 0)))
      const ideals = new Map(ordered.map((node) => [node, idealCentre({ node, chainEnds })]))
      placeColumn({ nodes: ordered, ideals, padding, markerSize })
    }
    generator.update(laidOut)
  }

  // Crop to what was drawn.
  const top = Math.min(...laidOut.nodes.map((node) => node.y0 ?? 0))
  const bottom = Math.max(...laidOut.nodes.map((node) => node.y1 ?? 0))
  for (const node of laidOut.nodes) {
    node.y0 = (node.y0 ?? 0) - top
    node.y1 = (node.y1 ?? 0) - top
  }
  generator.update(laidOut)

  const nodeById = new Map(diagram.nodes.map((node) => [node.id, node]))
  const positionedNodes = laidOut.nodes.flatMap((node): PositionedRouteNode[] => {
    const diagramNode = nodeById.get(node.id)
    return diagramNode
      ? [
          {
            ...diagramNode,
            x0: node.x0 ?? 0,
            x1: node.x1 ?? 0,
            y0: node.y0 ?? 0,
            y1: node.y1 ?? 0,
            column: node.column,
          },
        ]
      : []
  })

  const positionedLinks = diagram.links.map((link): PositionedRouteLink => {
    const legs = legsByLinkId.get(link.id) ?? []
    const first = legs[0]
    const last = legs[legs.length - 1]
    return {
      ...link,
      width: first?.width ?? 0,
      path: linkPath(legs),
      sourceX: (first?.source as NodeDatum | undefined)?.x1 ?? 0,
      targetX: (last?.target as NodeDatum | undefined)?.x0 ?? 0,
    }
  })

  return {
    nodes: positionedNodes,
    links: positionedLinks,
    columnCount: lastColumn + 1,
    height: Math.min(bottom - top, height),
  }
}
