import type { SankeyLink, SankeyNode } from 'd3-sankey'

/**
 * Re-packing of the route Sankey's middle columns after d3 has laid them out: the gap rules between stacked bars and
 * pass-through slots, where each would sit unobstructed, and the 1-D solver that places a column around those.
 */

/**
 * A layout node is a token bar, or a pass-through slot: the room a ribbon that skips a column takes in that
 * column, so it is stacked with the bars there instead of being drawn through one.
 */
export interface LayoutNodeDatum {
  id: string
  column: number
  isSlot: boolean
}

/** One column-to-column leg of a diagram link; a link that skips columns has one leg per column it crosses. */
export interface LayoutLinkDatum {
  linkId: string
  leg: number
  source: string
  target: string
  value: number
}

export type NodeDatum = SankeyNode<LayoutNodeDatum, LayoutLinkDatum>
export type LinkDatum = SankeyLink<LayoutNodeDatum, LayoutLinkDatum>

/** Gap next to a pass-through slot. Only two token bars need the full padding, which clears their logos. */
export const SLOT_GAP = 8
/** Room kept between a token's logo and whatever is stacked next to its bar. */
const MARKER_CLEARANCE = 2

/**
 * Gap between two stacked nodes: the full padding between two bars, a small one next to a slot, and in both cases
 * enough that a logo on a bar shorter than it (centred, so it overhangs both ends) clears its neighbour.
 */
function gapBetween({
  upper,
  lower,
  padding,
  markerSize,
}: {
  upper: NodeDatum
  lower: NodeDatum
  padding: number
  markerSize: number
}): number {
  const overhang = (node: NodeDatum): number =>
    node.isSlot ? 0 : Math.max((markerSize - ((node.y1 ?? 0) - (node.y0 ?? 0))) / 2, 0)
  const markerRoom = overhang(upper) + overhang(lower) + (markerSize > 0 ? MARKER_CLEARANCE : 0)
  const base = !upper.isSlot && !lower.isSlot ? padding : Math.min(SLOT_GAP, padding)
  return Math.max(base, markerRoom)
}

/**
 * Where a node sits when nothing is in its way: a slot on the straight line its ribbons would take between their
 * ends, a bar where its own ribbons run flattest. Each is the flow-weighted mean of those heights (centre y).
 */
export function idealCentre({ node, chainEnds }: { node: NodeDatum; chainEnds: Map<string, ChainEnds> }): number {
  let weighted = 0
  let total = 0
  if (node.isSlot) {
    const x = ((node.x0 ?? 0) + (node.x1 ?? 0)) / 2
    for (const leg of node.targetLinks ?? []) {
      const ends = chainEnds.get(leg.linkId)
      if (ends) {
        const t = ends.x1 > ends.x0 ? (x - ends.x0) / (ends.x1 - ends.x0) : 0
        weighted += leg.value * (ends.y0 + (ends.y1 - ends.y0) * t)
        total += leg.value
      }
    }
  } else {
    for (const leg of node.targetLinks ?? []) {
      weighted += leg.value * (leg.y0 ?? 0)
      total += leg.value
    }
    for (const leg of node.sourceLinks ?? []) {
      weighted += leg.value * (leg.y1 ?? 0)
      total += leg.value
    }
  }
  return total > 0 ? weighted / total : ((node.y0 ?? 0) + (node.y1 ?? 0)) / 2
}

interface ChainEnds {
  x0: number
  y0: number
  x1: number
  y1: number
}

/** Where each diagram link leaves its source bar and enters its target bar. */
export function measureChainEnds(legsByLinkId: Map<string, LinkDatum[]>): Map<string, ChainEnds> {
  const ends = new Map<string, ChainEnds>()
  for (const [linkId, legs] of legsByLinkId) {
    const first = legs[0]
    const last = legs[legs.length - 1]
    if (first && last) {
      ends.set(linkId, {
        x0: (first.source as NodeDatum).x1 ?? 0,
        y0: first.y0 ?? 0,
        x1: (last.target as NodeDatum).x0 ?? 0,
        y1: last.y1 ?? 0,
      })
    }
  }
  return ends
}

/**
 * Places one column's nodes, kept in their order, as close to their ideal tops as the gaps allow: overlapping
 * neighbours merge into a block that settles at its members' flow-weighted mean (1-D separation constraints on a
 * chain, which a single stack pass solves).
 */
export function placeColumn({
  nodes,
  ideals,
  padding,
  markerSize,
}: {
  nodes: NodeDatum[]
  ideals: Map<NodeDatum, number>
  padding: number
  markerSize: number
}): void {
  interface Block {
    members: { node: NodeDatum; offset: number }[]
    weight: number
    weightedTop: number
    extent: number
  }
  const blocks: Block[] = []
  for (const node of nodes) {
    const height = (node.y1 ?? 0) - (node.y0 ?? 0)
    const weight = Math.max(node.value ?? 0, 1)
    const idealTop = (ideals.get(node) ?? 0) - height / 2
    let block: Block = { members: [{ node, offset: 0 }], weight, weightedTop: weight * idealTop, extent: height }
    for (;;) {
      const previous = blocks[blocks.length - 1]
      const lastOfPrevious = previous?.members[previous.members.length - 1]
      if (!previous || !lastOfPrevious) {
        break
      }
      const gap = gapBetween({
        upper: lastOfPrevious.node,
        lower: block.members[0]?.node ?? node,
        padding,
        markerSize,
      })
      const shift = previous.extent + gap
      if (previous.weightedTop / previous.weight + shift <= block.weightedTop / block.weight) {
        break
      }
      blocks.pop()
      block = {
        members: [
          ...previous.members,
          ...block.members.map((member) => ({ ...member, offset: member.offset + shift })),
        ],
        weight: previous.weight + block.weight,
        weightedTop: previous.weightedTop + block.weightedTop - block.weight * shift,
        extent: shift + block.extent,
      }
    }
    blocks.push(block)
  }
  for (const block of blocks) {
    const top = block.weightedTop / block.weight
    for (const { node, offset } of block.members) {
      const height = (node.y1 ?? 0) - (node.y0 ?? 0)
      node.y0 = top + offset
      node.y1 = node.y0 + height
    }
  }
}
