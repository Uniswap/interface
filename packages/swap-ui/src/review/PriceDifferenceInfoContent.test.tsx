// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PriceDifferenceCaption, PriceDifferenceLearnMoreButton } from './PriceDifferenceInfoContent'

describe('PriceDifferenceCaption', () => {
  it('renders the caption text as given', () => {
    render(<PriceDifferenceCaption caption="Some explainer" container="tooltip" />)
    expect(screen.getByText('Some explainer')).toBeTruthy()
  })

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
  it('emits onPress and never resolves a URL itself', () => {
    const onPress = vi.fn()
    render(<PriceDifferenceLearnMoreButton container="modal" onPress={onPress} />)
    fireEvent.click(screen.getByText('common.button.learn'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

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
