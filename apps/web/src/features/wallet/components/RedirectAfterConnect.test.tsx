import { act, render } from '@testing-library/react'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { RedirectAfterConnect } from '~/features/wallet/components/RedirectAfterConnect'
import { useRedirectAfterConnectStore } from '~/features/wallet/hooks/useRedirectAfterConnect'
import { isEmbedDocument } from '~/utils/isEmbedDocument'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal()),
  useFeatureFlag: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}))

vi.mock('uniswap/src/features/accounts/store/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useActiveAddresses: vi.fn(),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', async (importOriginal) => ({
  ...(await importOriginal()),
  useEnabledChains: vi.fn(),
}))

vi.mock('uniswap/src/features/dataApi/balances/balancesRest', async (importOriginal) => ({
  ...(await importOriginal()),
  usePortfolioTotalValue: vi.fn(),
}))

vi.mock('~/utils/isEmbedDocument', async (importOriginal) => ({
  ...(await importOriginal()),
  isEmbedDocument: vi.fn(),
}))

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

const mockRefetch = vi.fn()

// Data and errors default to fetched now, i.e. after the request; pass `dataUpdatedAt`/`errorUpdatedAt` to model a cached entry.
function mockBalance(result: Partial<ReturnType<typeof usePortfolioTotalValue>>): void {
  vi.mocked(usePortfolioTotalValue).mockReturnValue({
    loading: false,
    refetch: mockRefetch,
    dataUpdatedAt: result.data ? Date.now() : undefined,
    errorUpdatedAt: result.error ? Date.now() : undefined,
    ...result,
  } as ReturnType<typeof usePortfolioTotalValue>)
}

function requestRedirect(fallbackPath?: string): void {
  act(() => useRedirectAfterConnectStore.getState().request(fallbackPath))
}

describe('RedirectAfterConnect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockRefetch.mockResolvedValue(undefined)
    useRedirectAfterConnectStore.getState().clear()
    window.history.replaceState({}, '', '/')
    vi.mocked(isEmbedDocument).mockReturnValue(false)
    vi.mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.NewUserUx)
    vi.mocked(useActiveAddresses).mockReturnValue({ evmAddress: '0xabc', svmAddress: undefined })
    vi.mocked(useEnabledChains).mockReturnValue({ isTestnetModeEnabled: false } as ReturnType<typeof useEnabledChains>)
    mockBalance({ data: undefined, error: undefined })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('navigates straight to the fallback when the flag is off', () => {
    vi.mocked(useFeatureFlag).mockReturnValue(false)
    render(<RedirectAfterConnect />)

    requestRedirect('/swap')

    expect(mockNavigate).toHaveBeenCalledExactlyOnceWith('/swap')
    expect(useRedirectAfterConnectStore.getState().pending).toBeUndefined()
  })

  it('navigates straight to the fallback on testnet', () => {
    vi.mocked(useEnabledChains).mockReturnValue({ isTestnetModeEnabled: true } as ReturnType<typeof useEnabledChains>)
    render(<RedirectAfterConnect />)

    requestRedirect('/swap')

    expect(mockNavigate).toHaveBeenCalledExactlyOnceWith('/swap')
  })

  it('redirects an unfunded wallet to Portfolio', () => {
    const { rerender } = render(<RedirectAfterConnect />)
    requestRedirect('/swap')
    expect(mockNavigate).not.toHaveBeenCalled()

    mockBalance({ data: { balanceUSD: 0 } as never })
    rerender(<RedirectAfterConnect />)

    expect(mockNavigate).toHaveBeenCalledExactlyOnceWith('/portfolio')
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.UnfundedRedirectToPortfolio, {
      source: 'connect',
    })
  })

  it('redirects an unfunded wallet to Portfolio when connecting with no fallback', () => {
    const { rerender } = render(<RedirectAfterConnect />)
    requestRedirect()

    mockBalance({ data: { balanceUSD: 0 } as never })
    rerender(<RedirectAfterConnect />)

    expect(mockNavigate).toHaveBeenCalledExactlyOnceWith('/portfolio')
  })

  it.each([
    '/swap',
    '/buy',
    '/onramp-return',
    '/explore/tokens/ethereum/0xabc',
    '/explore/tokens/solana/So111',
    '/manage/passkey/0xabc',
  ])('leaves an unfunded wallet on %s without checking the balance', (pathname) => {
    window.history.replaceState({}, '', pathname)
    const { rerender } = render(<RedirectAfterConnect />)
    requestRedirect()

    expect(usePortfolioTotalValue).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }))
    mockBalance({ data: { balanceUSD: 0 } as never })
    rerender(<RedirectAfterConnect />)

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(useRedirectAfterConnectStore.getState().pending).toBeUndefined()
  })

  it('redirects an unfunded wallet to Portfolio when a stay page sends it away with a fallback', () => {
    window.history.replaceState({}, '', '/manage/passkey/0xabc')
    const { rerender } = render(<RedirectAfterConnect />)
    requestRedirect('/swap')

    mockBalance({ data: { balanceUSD: 0 } as never })
    rerender(<RedirectAfterConnect />)

    expect(mockNavigate).toHaveBeenCalledExactlyOnceWith('/portfolio')
  })

  it('leaves an unfunded wallet in place inside an embed, even after in-frame navigation', () => {
    vi.mocked(isEmbedDocument).mockReturnValue(true)
    window.history.replaceState({}, '', '/explore')
    const { rerender } = render(<RedirectAfterConnect />)
    requestRedirect()

    mockBalance({ data: { balanceUSD: 0 } as never })
    rerender(<RedirectAfterConnect />)

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(useRedirectAfterConnectStore.getState().pending).toBeUndefined()
  })

  it('ignores a cached balance from before the connect and refetches it', () => {
    const { rerender } = render(<RedirectAfterConnect />)
    const cachedAt = Date.now()
    vi.advanceTimersByTime(10)
    requestRedirect()

    mockBalance({ data: { balanceUSD: 0 } as never, dataUpdatedAt: cachedAt })
    rerender(<RedirectAfterConnect />)

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(mockRefetch).toHaveBeenCalled()

    mockBalance({ data: { balanceUSD: 12 } as never })
    rerender(<RedirectAfterConnect />)

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(useRedirectAfterConnectStore.getState().pending).toBeUndefined()
  })

  it('does not navigate again when an unfunded wallet connects on Portfolio', () => {
    window.history.replaceState({}, '', '/portfolio')
    const { rerender } = render(<RedirectAfterConnect />)
    requestRedirect()

    mockBalance({ data: { balanceUSD: 0 } as never })
    rerender(<RedirectAfterConnect />)

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()
    expect(useRedirectAfterConnectStore.getState().pending).toBeUndefined()
  })

  it('still redirects from a Portfolio sub-page to the overview', () => {
    window.history.replaceState({}, '', '/portfolio/tokens')
    const { rerender } = render(<RedirectAfterConnect />)
    requestRedirect()

    mockBalance({ data: { balanceUSD: 0 } as never })
    rerender(<RedirectAfterConnect />)

    expect(mockNavigate).toHaveBeenCalledExactlyOnceWith('/portfolio')
  })

  it('still redirects from pages without an add-funds path, like PDP or send', () => {
    window.history.replaceState({}, '', '/send')
    const { rerender } = render(<RedirectAfterConnect />)
    requestRedirect()

    mockBalance({ data: { balanceUSD: 0 } as never })
    rerender(<RedirectAfterConnect />)

    expect(mockNavigate).toHaveBeenCalledExactlyOnceWith('/portfolio')
  })

  it('keeps the page the connect started on if the user navigates before the balance resolves', () => {
    window.history.replaceState({}, '', '/send')
    const { rerender } = render(<RedirectAfterConnect />)
    requestRedirect()
    window.history.replaceState({}, '', '/swap')

    mockBalance({ data: { balanceUSD: 0 } as never })
    rerender(<RedirectAfterConnect />)

    expect(mockNavigate).toHaveBeenCalledExactlyOnceWith('/portfolio')
  })

  it('sends a funded wallet to the fallback', () => {
    const { rerender } = render(<RedirectAfterConnect />)
    requestRedirect('/swap')

    mockBalance({ data: { balanceUSD: 12 } as never })
    rerender(<RedirectAfterConnect />)

    expect(mockNavigate).toHaveBeenCalledExactlyOnceWith('/swap')
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('leaves a funded wallet on the current page when there is no fallback', () => {
    const { rerender } = render(<RedirectAfterConnect />)
    requestRedirect()

    mockBalance({ data: { balanceUSD: 12 } as never })
    rerender(<RedirectAfterConnect />)

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(useRedirectAfterConnectStore.getState().pending).toBeUndefined()
  })

  it('keeps a page fallback when a bare connect request arrives after it', () => {
    const { rerender } = render(<RedirectAfterConnect />)
    requestRedirect('/swap')
    requestRedirect()

    mockBalance({ data: { balanceUSD: 12 } as never })
    rerender(<RedirectAfterConnect />)

    expect(mockNavigate).toHaveBeenCalledExactlyOnceWith('/swap')
  })

  it('waits for the connected address before checking the balance', () => {
    vi.mocked(useActiveAddresses).mockReturnValue({ evmAddress: undefined, svmAddress: undefined })
    const { rerender } = render(<RedirectAfterConnect />)
    requestRedirect()

    expect(usePortfolioTotalValue).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }))

    vi.mocked(useActiveAddresses).mockReturnValue({ evmAddress: '0xabc', svmAddress: undefined })
    rerender(<RedirectAfterConnect />)

    expect(usePortfolioTotalValue).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: true }))
  })

  it('sends the wallet to the fallback when the balance query fails', () => {
    const { rerender } = render(<RedirectAfterConnect />)
    requestRedirect('/swap')

    mockBalance({ data: undefined, error: new Error('boom') })
    rerender(<RedirectAfterConnect />)

    expect(mockNavigate).toHaveBeenCalledExactlyOnceWith('/swap')
  })

  it('refetches instead of falling back on an error cached before the connect', () => {
    mockBalance({ data: undefined, error: new Error('boom'), errorUpdatedAt: Date.now() - 1 })
    const { rerender } = render(<RedirectAfterConnect />)
    requestRedirect('/swap')
    rerender(<RedirectAfterConnect />)

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(mockRefetch).toHaveBeenCalled()

    mockBalance({ data: { balanceUSD: 0 } as never })
    rerender(<RedirectAfterConnect />)

    expect(mockNavigate).toHaveBeenCalledExactlyOnceWith('/portfolio')
  })

  it('falls back after a timeout when the balance never arrives', () => {
    render(<RedirectAfterConnect />)
    requestRedirect('/swap')
    expect(mockNavigate).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(mockNavigate).toHaveBeenCalledExactlyOnceWith('/swap')
  })
})
