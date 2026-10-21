import { act, fireEvent, screen } from '@testing-library/react'
import { Token } from '@uniswap/sdk-core'
import { MarginApiClient, type MarginPendingPlan } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { buildCurrencyId, normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { buildPendingRowSubtitle, MarginPendingSection } from '~/pages/Swap/Margin/components/MarginPendingSection'
import { marginPlanExecutionStore } from '~/pages/Swap/Margin/hooks/marginPlanExecutionStore'
import { render } from '~/test-utils/render'

const { mockAccountAddress, mockPendingPlans } = vi.hoisted(() => ({
  mockAccountAddress: '0x000000000000000000000000000000000000000A',
  mockPendingPlans: { current: [] as MarginPendingPlan[] },
}))

vi.mock('~/hooks/useAccount', () => ({
  useAccount: () => ({ address: mockAccountAddress }),
}))

// Never resolves: the cancel must be observable while its POST is still in flight, which is the whole
// window the interlock exists to cover.
vi.mock('uniswap/src/data/apiClients/tradingApi/MarginApiClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/tradingApi/MarginApiClient')>()),
  MarginApiClient: { cancelMarginPlan: vi.fn(() => new Promise(() => {})) },
}))

vi.mock('~/pages/Swap/Margin/hooks/marginPendingPlans', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/Swap/Margin/hooks/marginPendingPlans')>()),
  useMarginPendingPlans: () => mockPendingPlans.current,
}))

// Registry down/empty for every key — the row must fall back to the currency-info-backed synthetic
// market rather than losing its pair label.
vi.mock('~/pages/Swap/Margin/hooks/useMarginMarkets', () => ({
  useMarginMarkets: () => ({
    groups: [],
    markets: [],
    getMarketByTokens: () => undefined,
    getLive: () => undefined,
    isLoading: false,
    isFetching: false,
    error: undefined,
    dataUpdatedAt: 0,
    refetch: vi.fn(),
  }),
}))

const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

const WETH_INFO: CurrencyInfo = buildCurrencyInfo({
  currency: new Token(MARGIN_CHAIN_ID, WETH_ADDRESS, 18, 'WETH', 'Wrapped Ether'),
  currencyId: buildCurrencyId(MARGIN_CHAIN_ID, WETH_ADDRESS),
  logoUrl: null,
})
const USDC_INFO: CurrencyInfo = buildCurrencyInfo({
  currency: new Token(MARGIN_CHAIN_ID, USDC_ADDRESS, 6, 'USDC', 'USD Coin'),
  currencyId: buildCurrencyId(MARGIN_CHAIN_ID, USDC_ADDRESS),
  logoUrl: null,
})
const CURRENCY_INFO_BY_ID = new Map([
  [normalizeCurrencyIdForMapLookup(WETH_INFO.currencyId), WETH_INFO],
  [normalizeCurrencyIdForMapLookup(USDC_INFO.currencyId), USDC_INFO],
])

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: () => undefined,
  useCurrencyInfos: (ids: string[]) => ids.map((id) => CURRENCY_INFO_BY_ID.get(normalizeCurrencyIdForMapLookup(id))),
}))

const PENDING: MarginPendingPlan = {
  planId: 'plan-1',
  marketKey: 'weth-usdc-MORPHO',
  venue: 'MORPHO',
  collateralToken: WETH_ADDRESS,
  debtToken: USDC_ADDRESS,
  currentStep: 0,
  stepCount: 3,
  cancellable: true,
}

afterEach(() => {
  mockPendingPlans.current = []
  marginPlanExecutionStore.getState().actions.reset()
  vi.clearAllMocks()
})

describe('MarginPendingSection', () => {
  it('resolves the pair label from currency info when the market registry has no entry for the pending plan', () => {
    mockPendingPlans.current = [PENDING]
    render(<MarginPendingSection />)
    expect(screen.getByText('ETH / USDC')).toBeTruthy()
  })

  // The debt leg (USDC) still resolves on its own, but degrading only that leg would mix a real
  // symbol with a hex string — both legs must truncate together, and the raw marketKey must never
  // surface as a stand-in for the pair.
  it('truncates BOTH legs — never the raw market key — when one leg cannot resolve from currency info', () => {
    const unresolvedCollateral = '0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead'
    mockPendingPlans.current = [{ ...PENDING, collateralToken: unresolvedCollateral }]
    render(<MarginPendingSection />)
    expect(screen.queryByText(PENDING.marketKey)).not.toBeInTheDocument()
    expect(
      screen.getByText(
        `${shortenAddress({ address: unresolvedCollateral })} / ${shortenAddress({ address: USDC_ADDRESS })}`,
      ),
    ).toBeTruthy()
  })

  it('labels the pending leverage instead of dropping a bare multiplier into the subtitle', () => {
    mockPendingPlans.current = [{ ...PENDING, leverageTarget: '2' }]
    render(<MarginPendingSection />)
    expect(screen.getByText(/2x leverage/)).toBeInTheDocument()
  })

  // Cancel is the card's only affordance: a stranded open is recovered by cancelling and reopening,
  // and re-driving a plan the user walked away from is not a recovery path.
  it('offers Cancel and never a Resume on a stranded plan', () => {
    mockPendingPlans.current = [PENDING]
    render(<MarginPendingSection />)
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    // The catalog string is "Resume incomplete open", so an exact queryByText('Resume') could never
    // match and the assertion would pass with a Resume button right there. Match the real copy.
    expect(screen.queryByText(/Resume/)).not.toBeInTheDocument()
  })

  // The executor and the cancel describe the SAME plan and their controls sit one above the other
  // (the resume banner over this card), so both can be clicked inside one network round-trip. Without
  // the interlock the resumed run signs and broadcasts against a plan the server is cancelling, and
  // the cancel's own teardown then deletes the proof recording that broadcast.
  it('takes the executor lock for the cancel, so a concurrent resume cannot start', () => {
    mockPendingPlans.current = [PENDING]
    render(<MarginPendingSection />)

    fireEvent.click(screen.getByText('Cancel'))

    expect(marginPlanExecutionStore.getState().executingPlanId).toBe(PENDING.planId)
    // What `runLoop` does on entry — with the lock held it cannot acquire, so no prompt is sent.
    expect(marginPlanExecutionStore.getState().actions.tryAcquireExecution({ planId: PENDING.planId }).acquired).toBe(
      false,
    )
  })

  // The mirror direction, already closed by `shouldOfferPendingCancel` at render time — but the click
  // handler must refuse too, for a run that starts between that render and the click.
  it('refuses to cancel when the executor already holds the lock', () => {
    mockPendingPlans.current = [PENDING]
    render(<MarginPendingSection />)
    act(() => {
      marginPlanExecutionStore.getState().actions.tryAcquireExecution({ planId: 'some-other-plan' })
    })

    fireEvent.click(screen.getByText('Cancel'))

    expect(marginPlanExecutionStore.getState().executingPlanId).toBe('some-other-plan')
    expect(MarginApiClient.cancelMarginPlan).not.toHaveBeenCalled()
  })

  // The refusal has to SPEAK. `offerCancel` only goes false for a lock held under THIS plan's id, so a
  // lock taken by another plan — or as 'PENDING_CREATE' — leaves this button enabled; silent, every
  // click was a dead no-op with no spinner and no message. Reachable with two stranded cards: cancel A,
  // then click Cancel on B while A's POST is still in flight.
  it('says so rather than dying silently when another plan holds the lock', () => {
    mockPendingPlans.current = [PENDING]
    render(<MarginPendingSection />)
    act(() => {
      marginPlanExecutionStore.getState().actions.tryAcquireExecution({ planId: 'some-other-plan' })
    })

    expect(screen.queryByText(/Can’t cancel right now/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.getByText(/Can’t cancel right now/)).toBeInTheDocument()
  })

  it('leaves a non-cancellable plan with no action at all', () => {
    mockPendingPlans.current = [{ ...PENDING, cancellable: false }]
    render(<MarginPendingSection />)
    expect(screen.getByText('ETH / USDC')).toBeInTheDocument()
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
  })
})

// Tested directly rather than through the component: the render path mocks `useCurrencyInfo` to
// undefined, which short-circuits this branch before the decode — so a component-level assertion here
// would pass without ever reaching the code it claims to cover.
describe('buildPendingRowSubtitle payment amount', () => {
  const t = ((key: string, opts?: Record<string, unknown>) => `${key}:${opts?.amount ?? ''}`) as unknown as Parameters<
    typeof buildPendingRowSubtitle
  >[0]['t']
  const formatNumberOrString = ({ value }: { value?: number | string }): string => String(value)

  const build = (amount: string): string =>
    buildPendingRowSubtitle({
      pending: {
        ...PENDING,
        swapConfig: { token: USDC_ADDRESS, chainId: MARGIN_CHAIN_ID, amount },
      } as unknown as MarginPendingPlan,
      paymentChainId: MARGIN_CHAIN_ID,
      paymentInfo: USDC_INFO,
      formatNumberOrString: formatNumberOrString as Parameters<
        typeof buildPendingRowSubtitle
      >[0]['formatNumberOrString'],
      t,
    })

  it('states a real payment amount', () => {
    expect(build('1500000')).toContain('1.5')
  })

  // This runs in the render body: an unguarded BigInt throws a SyntaxError on any non-integer string and
  // takes the whole positions surface to the error boundary rather than dropping one line of a subtitle.
  it.each(['1.5', '1e18', 'not-a-number'])('drops the line rather than throwing on %p', (amount) => {
    expect(() => build(amount)).not.toThrow()
    expect(build(amount)).not.toContain('paymentFrom')
  })

  // '0' has nothing to say here either.
  it('drops the line for the zero sentinel', () => {
    expect(build('0')).not.toContain('paymentFrom')
  })
})
