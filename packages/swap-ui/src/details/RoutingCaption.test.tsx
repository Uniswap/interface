// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { type RoutingCaptionDisplay, RoutingCaptionKind } from '../types'
import { RoutingCaption } from './RoutingCaption'

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

  it('left-aligns small text in the tooltip and centers larger text in the modal', () => {
    const caption: RoutingCaptionDisplay = { kind: RoutingCaptionKind.PoolsSummary, pools: 2, versions: ['V3'] }
    const { unmount } = render(<RoutingCaption container="tooltip" caption={caption} />)
    const inTooltip = screen.getByText('swap.routing.poolsAndVersions').className
    unmount()
    render(<RoutingCaption container="modal" caption={caption} />)
    const inModal = screen.getByText('swap.routing.poolsAndVersions').className

    expect(inTooltip).toContain('text-left')
    expect(inTooltip).toContain('text-[12px]')
    expect(inModal).toContain('text-center')
    expect(inModal).toContain('text-[16px]')
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
