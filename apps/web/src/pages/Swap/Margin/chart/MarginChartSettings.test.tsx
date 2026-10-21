import { fireEvent, screen } from '@testing-library/react'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { DEFAULT_MARGIN_CHART_PREFS, type MarginChartPrefs } from '~/pages/Swap/Margin/chart/marginChartPrefsStore'
import { MarginChartSettings } from '~/pages/Swap/Margin/chart/MarginChartSettings'
import { render } from '~/test-utils/render'

const { setChartPrefs, prefsHolder } = vi.hoisted(() => ({
  setChartPrefs: vi.fn(),
  prefsHolder: { current: {} as Record<string, unknown> },
}))

// Controllable prefs snapshot + spy action. The hook is read both bare and via a selector.
vi.mock('~/pages/Swap/Margin/chart/marginChartPrefsStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/pages/Swap/Margin/chart/marginChartPrefsStore')>()
  const useMarginChartPrefs = (selector?: (s: Record<string, unknown>) => unknown): unknown => {
    const state = { ...prefsHolder.current, setChartPrefs }
    return selector ? selector(state) : state
  }
  return { ...actual, useMarginChartPrefs }
})

// The real Popover portals and the real Switch needs layout; swap both for deterministic passthroughs
// so the popover body renders eagerly and toggles are plain buttons.
vi.mock('ui/src', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ui/src')>()
  const Popover = Object.assign(({ children }: { children: ReactNode }) => <>{children}</>, {
    Trigger: ({ children }: { children: ReactNode }) => <>{children}</>,
    Content: ({ children }: { children: ReactNode }) => <>{children}</>,
    Close: ({ children }: { children: ReactNode }) => <>{children}</>,
  })
  function Switch({
    checked,
    onCheckedChange,
    disabled,
    testID,
  }: {
    checked?: boolean
    onCheckedChange?: (v: boolean) => void
    disabled?: boolean
    testID?: string
  }): JSX.Element {
    return (
      <button
        type="button"
        data-testid={testID}
        data-checked={String(Boolean(checked))}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
      />
    )
  }
  return { ...actual, Popover, Switch }
})

// The glossary modal renders through the real Modal, which portals; honor isModalOpen so a closed
// glossary is genuinely absent from the tree.
vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children, isModalOpen }: { children: ReactNode; isModalOpen?: boolean }) =>
    isModalOpen ? <>{children}</> : null,
}))

function setPrefs(partial: Partial<MarginChartPrefs> = {}): void {
  prefsHolder.current = { ...DEFAULT_MARGIN_CHART_PREFS, ...partial }
}

const switchId = (key: keyof MarginChartPrefs): string => `margin-chart-settings-switch-${key}`

describe('MarginChartSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setPrefs()
  })

  it('toggles a checked pref off with the right partial', () => {
    render(<MarginChartSettings hasPosition symbol="ETH" />)

    fireEvent.click(screen.getByTestId(switchId('liqZone')))
    expect(setChartPrefs).toHaveBeenCalledWith({ liqZone: false })
  })

  it('toggles an unchecked pref on with the right partial', () => {
    setPrefs({ volume: false })
    render(<MarginChartSettings hasPosition symbol="ETH" />)

    fireEvent.click(screen.getByTestId(switchId('volume')))
    expect(setChartPrefs).toHaveBeenCalledWith({ volume: true })
  })

  it('disables the position sub-rows while the master toggle is off (master stays enabled)', () => {
    setPrefs({ showPosition: false })
    render(<MarginChartSettings hasPosition symbol="ETH" />)

    expect(screen.getByTestId(switchId('showPosition'))).not.toBeDisabled()
    expect(screen.getByTestId(switchId('liqZone'))).toBeDisabled()
    expect(screen.getByTestId(switchId('breakEven'))).toBeDisabled()
    expect(screen.getByTestId(switchId('markers'))).toBeDisabled()
    expect(screen.getByTestId(switchId('summaryChip'))).toBeDisabled()
  })

  it('disables the whole Position group and shows the hint when no position exists', () => {
    render(<MarginChartSettings hasPosition={false} symbol="ETH" />)

    expect(screen.getByText('Open a position to configure its overlays')).toBeInTheDocument()
    expect(screen.getByTestId(switchId('showPosition'))).toBeDisabled()
    expect(screen.getByTestId(switchId('liqZone'))).toBeDisabled()
    // Chart-group rows never depend on a position.
    expect(screen.getByTestId(switchId('volume'))).not.toBeDisabled()
  })

  it('opens the glossary modal from the link, passing the live leverage', () => {
    render(<MarginChartSettings hasPosition symbol="ETH" leverage="3x" />)

    expect(screen.queryByText('What’s on this chart')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId(TestID.MarginChartSettingsGlossaryLink))

    expect(screen.getByText('What’s on this chart')).toBeInTheDocument()
    expect(screen.getByText(/The price you opened at, at 3x leverage/)).toBeInTheDocument()
  })

  // The modal is a sibling of the popover, not a panel inside it: the link closes the popover, and
  // rendering the modal in the popover's place would unmount it on that very close.
  it('keeps the glossary modal mounted once the settings popover is gone', () => {
    render(<MarginChartSettings hasPosition symbol="ETH" leverage="3x" open={true} />)

    fireEvent.click(screen.getByTestId(TestID.MarginChartSettingsGlossaryLink))
    expect(screen.getByText('What’s on this chart')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId(TestID.MarginChartGlossaryClose))
    expect(screen.queryByText('What’s on this chart')).not.toBeInTheDocument()
  })
})
