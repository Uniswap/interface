import { fireEvent, screen } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import type { PropsWithChildren } from 'react'
import {
  type Warning,
  WarningAction,
  WarningLabel,
  WarningSeverity,
} from 'uniswap/src/components/modals/WarningModal/types'
import { TradeInfoRow } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/TradeInfoRow'
import type { GasInfo } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/types'
import { renderWithTheme } from 'uniswap/src/test/renderWithTheme'

const mockUseDebouncedTrade = vi.hoisted(() => vi.fn())

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return { ...actual, isMobileApp: false, isWebApp: true }
})

vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  return { ...actual, useFeatureFlag: (): boolean => false }
})

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: (): { isTestnetModeEnabled: boolean } => ({ isTestnetModeEnabled: false }),
}))

vi.mock('uniswap/src/features/gas/hooks/useEnableCustomGasFeeEntry', () => ({
  useEnableCustomGasFeeEntry: (): boolean => false,
}))

vi.mock('uniswap/src/features/transactions/swap/components/SwapRateRatio', () => ({
  SwapRateRatio: (): JSX.Element => <span>rate</span>,
}))

vi.mock(
  'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/TradeWarning',
  () => ({
    TradeWarning: ({ children }: PropsWithChildren): JSX.Element => <>{children}</>,
  }),
)

vi.mock(
  'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/CanonicalBridgeLinkBanner',
  () => ({
    CanonicalBridgeLinkBanner: (): JSX.Element => <span>bridge link</span>,
  }),
)

vi.mock(
  'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/GasInfoRow',
  () => ({
    GasInfoRow: ({ hidden }: { hidden?: boolean }): JSX.Element => <span>{`gas hidden=${String(hidden)}`}</span>,
  }),
)

vi.mock(
  'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/useDebouncedTrade',
  () => ({
    useDebouncedTrade: mockUseDebouncedTrade,
  }),
)

vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore', () => ({
  useSwapFormStoreDerivedSwapInfo: (selector: (state: object) => unknown): unknown => selector({}),
}))

const gasInfo = {} as GasInfo

const priceImpactWarning: Warning = {
  type: WarningLabel.PriceDifferenceHigh,
  severity: WarningSeverity.High,
  action: WarningAction.WarnBeforeSubmit,
  title: 'Very high price impact',
}

describe('TradeInfoRow on web', () => {
  beforeEach(() => {
    mockUseDebouncedTrade.mockReturnValue({})
  })

  it('makes the gas the details toggle once there is a trade, hiding it while open', () => {
    const onDetailsExpandedChange = vi.fn()
    const { rerender } = renderWithTheme(
      <TradeInfoRow detailsExpanded={false} gasInfo={gasInfo} onDetailsExpandedChange={onDetailsExpandedChange} />,
    )
    expect(screen.getByText('rate')).toBeTruthy()
    expect(screen.getByText('gas hidden=false')).toBeTruthy()

    fireEvent.click(screen.getByRole('button'))
    expect(onDetailsExpandedChange).toHaveBeenLastCalledWith(true)

    rerender(<TradeInfoRow detailsExpanded gasInfo={gasInfo} onDetailsExpandedChange={onDetailsExpandedChange} />)
    expect(screen.getByText('gas hidden=true')).toBeTruthy()
    fireEvent.click(screen.getByRole('button'))
    expect(onDetailsExpandedChange).toHaveBeenLastCalledWith(false)
  })

  it('renders the gas without a toggle before there is a trade', () => {
    mockUseDebouncedTrade.mockReturnValue(undefined)
    renderWithTheme(<TradeInfoRow detailsExpanded gasInfo={gasInfo} onDetailsExpandedChange={vi.fn()} />)
    expect(screen.getByText('gas hidden=undefined')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByText('rate')).toBeNull()
  })

  it('shows the warning line in place of the rate', () => {
    renderWithTheme(<TradeInfoRow gasInfo={gasInfo} warning={priceImpactWarning} onDetailsExpandedChange={vi.fn()} />)
    expect(screen.getByText('Very high price impact')).toBeTruthy()
    expect(screen.queryByText('rate')).toBeNull()
  })

  it('replaces the gas and toggle with the canonical bridge link', () => {
    renderWithTheme(
      <TradeInfoRow
        bridgeChainId={UniverseChainId.Robinhood}
        gasInfo={gasInfo}
        warning={{ ...priceImpactWarning, type: WarningLabel.NoQuotesFound, severity: WarningSeverity.Low }}
        onDetailsExpandedChange={vi.fn()}
      />,
    )
    expect(screen.getByText('bridge link')).toBeTruthy()
    expect(screen.queryByText(/^gas hidden/)).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
