// @vitest-environment jsdom
// Asserts mycelium's web Tailwind classes, which native does not emit, so it runs web-first only.
import { render, screen } from '@testing-library/react'
import {
  PriceDifferenceCaption,
  PriceDifferenceLearnMoreButton,
} from '@universe/transactions-ui/src/swap/PriceDifference/PriceDifferenceInfoContent'
import { describe, expect, it, vi } from 'vitest'

describe('PriceDifferenceCaption', () => {
  it('left-aligns small text in the tooltip and centers larger text in the modal', () => {
    const { unmount } = render(<PriceDifferenceCaption caption="tooltip body" container="tooltip" />)
    const inTooltip = screen.getByText('tooltip body').className
    unmount()
    render(<PriceDifferenceCaption caption="modal body" container="modal" />)
    const inModal = screen.getByText('modal body').className

    expect(inTooltip).toContain('text-left')
    expect(inTooltip).toContain('text-[12px]')
    expect(inModal).toContain('text-center')
    expect(inModal).toContain('text-[16px]')
  })
})

describe('PriceDifferenceLearnMoreButton', () => {
  it('uses the small body variant in the tooltip and the button label variant in the modal', () => {
    const { unmount } = render(<PriceDifferenceLearnMoreButton container="tooltip" onPress={vi.fn()} />)
    const inTooltip = screen.getByText('common.button.learn').className
    unmount()
    render(<PriceDifferenceLearnMoreButton container="modal" onPress={vi.fn()} />)
    const inModal = screen.getByText('common.button.learn').className

    expect(inTooltip).toContain('text-[12px]')
    expect(inModal).not.toContain('text-[12px]')
  })
})
