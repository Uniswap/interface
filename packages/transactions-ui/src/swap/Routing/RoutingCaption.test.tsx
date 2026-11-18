// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { RoutingCaption } from '@universe/transactions-ui/src/swap/Routing/RoutingCaption'
import { RoutingCaptionKind } from '@universe/transactions-ui/src/swap/types'
import { describe, expect, it } from 'vitest'

describe('RoutingCaption', () => {
  it('places the composed UniswapX sentence for the uniswapX kind', () => {
    render(
      <RoutingCaption
        container="modal"
        caption={{ kind: RoutingCaptionKind.UniswapX, content: <span>X aggregates liquidity</span> }}
      />,
    )
    expect(screen.getByText('X aggregates liquidity')).toBeTruthy()
  })

  it('renders the diagram and the description for the diagram kind', () => {
    render(
      <RoutingCaption
        container="tooltip"
        caption={{
          kind: RoutingCaptionKind.Diagram,
          diagram: <span>diagram slot</span>,
          descriptionText: 'cheapest route',
        }}
      />,
    )
    expect(screen.getByText('diagram slot')).toBeTruthy()
    expect(screen.getByText('cheapest route')).toBeTruthy()
  })

  it('renders only the diagram when the description is empty', () => {
    const withDescription = render(
      <RoutingCaption
        container="tooltip"
        caption={{ kind: RoutingCaptionKind.Diagram, diagram: <span>d</span>, descriptionText: 'route' }}
      />,
    )
    expect(withDescription.container.firstElementChild?.childElementCount).toBe(2)
    withDescription.unmount()

    const { container } = render(
      <RoutingCaption
        container="tooltip"
        caption={{ kind: RoutingCaptionKind.Diagram, diagram: <span>d</span>, descriptionText: '' }}
      />,
    )
    expect(container.firstElementChild?.childElementCount).toBe(1)
  })

  it('renders the pools summary key', () => {
    render(
      <RoutingCaption
        container="modal"
        caption={{ kind: RoutingCaptionKind.PoolsSummary, pools: 2, versions: ['V3', 'V4'] }}
      />,
    )
    expect(screen.getByText('swap.routing.poolsAndVersions')).toBeTruthy()
  })
})
