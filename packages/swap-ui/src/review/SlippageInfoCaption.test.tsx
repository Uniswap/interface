// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SlippageInfoCaption, type SlippageInfoCaptionProps } from './SlippageInfoCaption'

const slippage = { tolerance: '0.50%', isZero: false, isCustom: false, exceedsAuto: false }
const base: SlippageInfoCaptionProps = {
  container: 'tooltip',
  isExactInput: true,
  slippage,
  slippageAmount: '0.9950 ETH',
  showChainedMessage: false,
  chainedStepCount: 0,
  learnMoreLink: <span>learn more slot</span>,
}

describe('SlippageInfoCaption', () => {
  it('renders the learn-more slot whenever it is given, in either shell', () => {
    for (const container of ['tooltip', 'modal'] as const) {
      const r = render(<SlippageInfoCaption {...base} container={container} />)
      expect(screen.getByText('learn more slot')).toBeTruthy()
      r.unmount()
    }
    render(<SlippageInfoCaption {...base} learnMoreLink={undefined} />)
    expect(screen.queryByText('learn more slot')).toBeNull()
  })

  it('renders the tolerance summary only when asked, independent of the shell', () => {
    for (const container of ['tooltip', 'modal'] as const) {
      const r = render(<SlippageInfoCaption {...base} container={container} />)
      expect(screen.queryByText('swap.slippage.settings.title')).toBeNull()
      r.unmount()
    }
    render(<SlippageInfoCaption {...base} container="modal" showToleranceSummary />)
    expect(screen.getByText('swap.slippage.settings.title')).toBeTruthy()
    expect(screen.getByText('0.50%')).toBeTruthy()
  })

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

  it('puts the exceeds-auto warning above the amount in the tooltip and below it in the modal', () => {
    const exceeds = { ...slippage, exceedsAuto: true }
    const warningComesFirst = (container: 'tooltip' | 'modal'): boolean => {
      const r = render(<SlippageInfoCaption {...base} container={container} slippage={exceeds} />)
      const text = r.container.textContent
      r.unmount()
      return text.indexOf('swap.settings.slippage.warning.message') < text.indexOf('0.9950 ETH')
    }
    expect(warningComesFirst('tooltip')).toBe(true)
    expect(warningComesFirst('modal')).toBe(false)
  })

  it('switches copy between exact input and exact output', () => {
    const { unmount } = render(<SlippageInfoCaption {...base} />)
    expect(screen.getByText('swap.settings.slippage.input.receive.title')).toBeTruthy()
    unmount()
    render(<SlippageInfoCaption {...base} isExactInput={false} />)
    expect(screen.getByText('swap.settings.slippage.output.spend.title')).toBeTruthy()
  })

  it('shows the chained message only when asked', () => {
    const { unmount } = render(<SlippageInfoCaption {...base} />)
    expect(screen.queryByText('swap.settings.slippage.chained.message')).toBeNull()
    unmount()
    render(<SlippageInfoCaption {...base} showChainedMessage chainedStepCount={2} />)
    expect(screen.getByText('swap.settings.slippage.chained.message')).toBeTruthy()
  })

  it('shows the warning row when slippage exceeds auto, in both containers', () => {
    const { unmount } = render(<SlippageInfoCaption {...base} />)
    expect(screen.queryByText('swap.settings.slippage.warning.message')).toBeNull()
    unmount()
    for (const container of ['tooltip', 'modal'] as const) {
      const r = render(
        <SlippageInfoCaption {...base} container={container} slippage={{ ...slippage, exceedsAuto: true }} />,
      )
      expect(screen.getByText('swap.settings.slippage.warning.message')).toBeTruthy()
      r.unmount()
    }
  })

  it('renders the slippage amount', () => {
    render(<SlippageInfoCaption {...base} slippageAmount="1,005.00 USDC" />)
    expect(screen.getByText('1,005.00 USDC')).toBeTruthy()
  })
})
