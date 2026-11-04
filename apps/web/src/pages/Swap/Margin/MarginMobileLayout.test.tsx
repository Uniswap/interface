import { fireEvent, screen } from '@testing-library/react'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MarginMobileLayout } from '~/pages/Swap/Margin/MarginMobileLayout'
import { render } from '~/test-utils/render'

const { mockAccount, mockOpenAccountDrawer } = vi.hoisted(() => ({
  mockAccount: { current: { address: '0x000000000000000000000000000000000000000A' as string | undefined } },
  mockOpenAccountDrawer: vi.fn(),
}))

vi.mock('~/connection/hooks/useAccount', () => ({
  useAccount: () => mockAccount.current,
}))

vi.mock('~/state/accountDrawer/hooks', () => ({
  useAccountDrawer: () => ({ open: mockOpenAccountDrawer }),
}))

// The three panes have suites of their own; stubbed here so this suite tests only the layout's wiring.
vi.mock('~/pages/Swap/Margin/MarginForm', () => ({
  MarginForm: ({
    showInlinePositions,
    marketSelectorTrailing,
    marketSelectorFooter,
  }: {
    showInlinePositions: boolean
    marketSelectorTrailing?: ReactNode
    marketSelectorFooter?: ReactNode
  }) => (
    <div data-testid="margin-form-stub" data-inline-positions={String(showInlinePositions)}>
      {marketSelectorTrailing}
      <div data-testid="margin-form-footer-stub">{marketSelectorFooter}</div>
    </div>
  ),
}))

vi.mock('~/pages/Swap/Margin/MarginPositionsTable', () => ({
  MarginPositionsTable: ({ layout }: { layout?: string }) => (
    <div data-testid="margin-positions-stub" data-layout={layout} />
  ),
}))

vi.mock('~/pages/Swap/Margin/components/MarginMarketStatsRow', () => ({
  MarginMarketStatsRow: () => <div data-testid="margin-stats-row-stub" />,
}))

vi.mock('~/pages/Swap/Margin/MarginChartPane', () => ({
  MarginChartPane: ({ compact }: { compact?: boolean }) => (
    <div data-testid="margin-chart-pane-stub" data-compact={String(compact)} />
  ),
}))

afterEach(() => {
  mockAccount.current = { address: '0x000000000000000000000000000000000000000A' }
  mockOpenAccountDrawer.mockClear()
})

describe('MarginMobileLayout', () => {
  it('opens on the Trade tab: the form without its inline table, and no positions', () => {
    render(<MarginMobileLayout />)
    expect(screen.getByTestId(TestID.MarginMobileTabTrade)).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('margin-form-stub')).toHaveAttribute('data-inline-positions', 'false')
    expect(screen.queryByTestId('margin-positions-stub')).not.toBeInTheDocument()
  })

  it('switches to the Positions tab, which lists positions as cards, and back', () => {
    render(<MarginMobileLayout />)

    fireEvent.click(screen.getByTestId(TestID.MarginMobileTabPositions))
    expect(screen.getByTestId(TestID.MarginMobileTabPositions)).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId(TestID.MarginMobileTabTrade)).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByTestId('margin-positions-stub')).toHaveAttribute('data-layout', 'cards')
    expect(screen.queryByTestId('margin-form-stub')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId(TestID.MarginMobileTabTrade))
    expect(screen.getByTestId('margin-form-stub')).toBeInTheDocument()
    expect(screen.queryByTestId('margin-positions-stub')).not.toBeInTheDocument()
  })

  it('puts the market stats row under the market card on the Trade tab', () => {
    render(<MarginMobileLayout />)
    expect(screen.getByTestId('margin-form-footer-stub')).toContainElement(screen.getByTestId('margin-stats-row-stub'))
  })

  it('puts "View chart" beside the market card, and mounts no chart until it is pressed', () => {
    render(<MarginMobileLayout />)
    const viewChart = screen.getByTestId(TestID.MarginMobileViewChart)
    expect(screen.getByTestId('margin-form-stub')).toContainElement(viewChart)
    expect(viewChart).toHaveTextContent('View chart')
    expect(screen.queryByTestId('margin-chart-pane-stub')).not.toBeInTheDocument()
  })

  it('opens the compact chart in a bottom sheet and closes it again', () => {
    render(<MarginMobileLayout />)

    fireEvent.click(screen.getByTestId(TestID.MarginMobileViewChart))
    expect(screen.getByTestId('margin-chart-pane-stub')).toHaveAttribute('data-compact', 'true')

    fireEvent.click(screen.getByTestId(TestID.MarginChartSheetClose))
    expect(screen.queryByTestId('margin-chart-pane-stub')).not.toBeInTheDocument()
  })

  it('offers a wallet connection on the Positions tab when disconnected', () => {
    mockAccount.current = { address: undefined }
    render(<MarginMobileLayout />)

    fireEvent.click(screen.getByTestId(TestID.MarginMobileTabPositions))
    expect(screen.getByText('Connect a wallet to view your positions')).toBeInTheDocument()
    expect(screen.queryByTestId('margin-positions-stub')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Connect wallet'))
    expect(mockOpenAccountDrawer).toHaveBeenCalledTimes(1)
  })
})
