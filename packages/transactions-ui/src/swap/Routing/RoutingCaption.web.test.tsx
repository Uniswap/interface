// @vitest-environment jsdom
// Asserts mycelium's web Tailwind classes, which native does not emit, so it runs web-first only.
import { render, screen } from '@testing-library/react'
import { RoutingCaption } from '@universe/transactions-ui/src/swap/Routing/RoutingCaption'
import { type RoutingCaptionDisplay, RoutingCaptionKind } from '@universe/transactions-ui/src/swap/types'
import { describe, expect, it } from 'vitest'

describe('RoutingCaption', () => {
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
})
