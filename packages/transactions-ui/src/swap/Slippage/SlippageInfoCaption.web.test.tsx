// @vitest-environment jsdom
// Asserts mycelium's web Tailwind classes, which native does not emit, so it runs web-first only.
import { render, screen } from '@testing-library/react'
import {
  SlippageInfoCaption,
  type SlippageInfoCaptionProps,
} from '@universe/transactions-ui/src/swap/Slippage/SlippageInfoCaption'
import { describe, expect, it } from 'vitest'

const base: SlippageInfoCaptionProps = {
  container: 'tooltip',
  isExactInput: true,
  slippage: { tolerance: '0.50%', isZero: false, isCustom: false, exceedsAuto: false },
  slippageAmount: '0.9950 ETH',
  showChainedMessage: false,
  chainedStepCount: 0,
  learnMoreLink: <span>learn more slot</span>,
}

describe('SlippageInfoCaption', () => {
  it('lays the body out for the shell it renders in', () => {
    const { unmount } = render(<SlippageInfoCaption {...base} />)
    const inTooltip = screen.getByText('swap.settings.slippage.input.message', { exact: false }).className
    unmount()
    render(<SlippageInfoCaption {...base} container="modal" />)
    const inModal = screen.getByText('swap.settings.slippage.input.message', { exact: false }).className

    expect(inTooltip).toContain('text-left')
    expect(inTooltip).toContain('text-[12px]')
    expect(inModal).toContain('text-center')
    expect(inModal).toContain('text-[16px]')
  })
})
