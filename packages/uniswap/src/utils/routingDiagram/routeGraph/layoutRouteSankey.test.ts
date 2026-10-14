import { TradingApi } from '@universe/api'
import type { RouteDiagram, RouteDiagramLink } from 'uniswap/src/utils/routingDiagram/routeGraph/buildRouteDiagram'
import { layoutRouteSankey } from 'uniswap/src/utils/routingDiagram/routeGraph/layoutRouteSankey'

const SIZE = { width: 400, height: 200, nodeWidth: 8, nodePadding: 24 }

function node(id: string): RouteDiagram['nodes'][number] {
  return { id, tokenKey: id, currencyId: id, symbol: id }
}

function link(source: string, target: string, shareBps: number): RouteDiagramLink {
  return {
    id: `${source}>${target}`,
    source,
    target,
    shareBps,
    protocol: TradingApi.RouteGraphPool.protocol.V3,
    poolAddress: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
    isDynamicFee: false,
  }
}

// USDC -> WETH directly (60%) and through USDS (40%).
const SPLIT: RouteDiagram = {
  nodes: [node('USDC'), node('USDS'), node('WETH')],
  links: [link('USDC', 'WETH', 6000), link('USDC', 'USDS', 4000), link('USDS', 'WETH', 4000)],
}

function expectWithinBounds(layout: ReturnType<typeof layoutRouteSankey>): void {
  for (const n of layout.nodes) {
    expect(n.y0).toBeGreaterThanOrEqual(0)
    expect(n.y1).toBeLessThanOrEqual(SIZE.height + 1e-6)
    expect(n.y1).toBeGreaterThan(n.y0)
  }
  for (const l of layout.links) {
    expect(l.width).toBeGreaterThan(0)
    expect(l.path).not.toContain('NaN')
  }
}

describe(layoutRouteSankey, () => {
  it('returns an empty layout before the container has a size', () => {
    expect(layoutRouteSankey({ diagram: SPLIT, ...SIZE, width: 0 }).nodes).toEqual([])
  })

  it('puts the input token first, the output token last and the hop token between', () => {
    const layout = layoutRouteSankey({ diagram: SPLIT, ...SIZE })
    const columnOf = (id: string): number | undefined => layout.nodes.find((n) => n.id === id)?.column
    expect(layout.columnCount).toBe(3)
    expect([columnOf('USDC'), columnOf('USDS'), columnOf('WETH')]).toEqual([0, 1, 2])
    expectWithinBounds(layout)
  })

  it('sizes ribbons by share of input', () => {
    const layout = layoutRouteSankey({ diagram: SPLIT, ...SIZE })
    const width = (id: string): number => layout.links.find((l) => l.id === id)?.width ?? 0
    expect(width('USDC>WETH') / width('USDC>USDS')).toBeCloseTo(1.5)
  })

  it('keeps every bar visible on a dense route by shrinking the padding', () => {
    const hops = Array.from({ length: 24 }, (_, i) => `T${i}`)
    const dense: RouteDiagram = {
      nodes: [node('IN'), ...hops.map(node), node('OUT')],
      links: hops.flatMap((hop, i) => [
        link('IN', hop, i === 0 ? 10000 - 23 * 400 : 400),
        link(hop, 'OUT', i === 0 ? 800 : 400),
      ]),
    }
    expectWithinBounds(layoutRouteSankey({ diagram: dense, ...SIZE }))
  })

  it('caps the thickness of a single-path route and shrinks the layout to fit', () => {
    const single: RouteDiagram = { nodes: [node('USDC'), node('WETH')], links: [link('USDC', 'WETH', 10000)] }
    const layout = layoutRouteSankey({ diagram: single, ...SIZE, maxFlowHeight: 60 })
    expect(layout.height).toBe(60)
    expect(layout.links[0]?.width).toBeCloseTo(60)
    expect(layoutRouteSankey({ diagram: single, ...SIZE }).height).toBe(SIZE.height)
  })

  it('keeps the input and output bars to maxFlowHeight on one band when the route has a hop', () => {
    const layout = layoutRouteSankey({ diagram: SPLIT, ...SIZE, maxFlowHeight: 100 })
    const bar = (id: string): { y0: number; y1: number } => {
      const n = layout.nodes.find((candidate) => candidate.id === id)
      return { y0: n?.y0 ?? NaN, y1: n?.y1 ?? NaN }
    }
    expect(bar('USDC').y1 - bar('USDC').y0).toBeCloseTo(100)
    expect(bar('WETH').y0).toBeCloseTo(bar('USDC').y0)
    expect(bar('WETH').y1).toBeCloseTo(bar('USDC').y1)
    // The hop column stacks USDS and the direct band's slot a small gap apart, a little taller than the band.
    expect(layout.height).toBeGreaterThan(100)
    expect(layout.height).toBeLessThan(100 + SIZE.nodePadding)
    expectWithinBounds(layout)
  })

  it('routes a link that skips a column past the bars in that column, a small gap from them', () => {
    const layout = layoutRouteSankey({ diagram: SPLIT, ...SIZE, maxFlowHeight: 100 })
    const direct = layout.links.find((l) => l.id === 'USDC>WETH')
    const usds = layout.nodes.find((n) => n.id === 'USDS')
    // One smooth curve through the hop column's slot: a cubic into it and one out of it.
    expect(direct?.path.match(/C/g)).toHaveLength(2)
    const slotY = Number(direct?.path.match(/^M[^C]*C[^C]* [\d.-]+,([\d.-]+)C/)?.[1])
    const halfWidth = (direct?.width ?? 0) / 2
    const gapBelowBar = slotY - halfWidth - (usds?.y1 ?? 0)
    const gapAboveBar = (usds?.y0 ?? 0) - (slotY + halfWidth)
    const gap = Math.max(gapBelowBar, gapAboveBar)
    expect(gap).toBeGreaterThanOrEqual(-1e-6)
    expect(gap).toBeLessThan(SIZE.nodePadding)
  })

  it('gives a route with side routes the multi-hop band and keeps a single path compact', () => {
    const inputBar = (diagram: RouteDiagram): number => {
      const layout = layoutRouteSankey({ diagram, ...SIZE, maxFlowHeight: 60, maxMultiHopFlowHeight: 120 })
      const input = layout.nodes.find((n) => n.column === 0)
      return (input?.y1 ?? 0) - (input?.y0 ?? 0)
    }
    // USDS shares its column with the direct band's slot, so the split curves around the band.
    expect(inputBar(SPLIT)).toBeCloseTo(120)
    const chain: RouteDiagram = {
      nodes: [node('USDC'), node('USDS'), node('WETH')],
      links: [link('USDC', 'USDS', 10000), link('USDS', 'WETH', 10000)],
    }
    expect(inputBar(chain)).toBeCloseTo(60)
  })

  it('keeps the logos on thin stacked bars clear of each other', () => {
    const thin: RouteDiagram = {
      nodes: [node('IN'), node('A'), node('B'), node('OUT')],
      links: [
        link('IN', 'OUT', 9800),
        link('IN', 'A', 100),
        link('A', 'OUT', 100),
        link('IN', 'B', 100),
        link('B', 'OUT', 100),
      ],
    }
    const layout = layoutRouteSankey({ diagram: thin, ...SIZE, nodePadding: 14, maxFlowHeight: 100, markerSize: 18 })
    const centre = (id: string): number => {
      const n = layout.nodes.find((candidate) => candidate.id === id)
      return ((n?.y0 ?? 0) + (n?.y1 ?? 0)) / 2
    }
    expect(Math.abs(centre('A') - centre('B'))).toBeGreaterThanOrEqual(18 + 2 - 1e-6)
  })

  it('never grows the layout past the requested height', () => {
    const layout = layoutRouteSankey({ diagram: SPLIT, ...SIZE, maxFlowHeight: 1000 })
    expect(layout.height).toBe(SIZE.height)
    expectWithinBounds(layout)
  })
})
