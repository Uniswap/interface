import { act, renderHook } from '@testing-library/react'
import { type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest'
import { useXOAuthFlow } from '~/pages/Liquidity/CreateAuction/hooks/useXOAuthFlow'
import { CreateAuctionStoreContext } from '~/pages/Liquidity/CreateAuction/store/CreateAuctionStoreContext'
import { createCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'

const { mockGetXAuthUrl, mockActiveAddress } = vi.hoisted(() => ({
  mockGetXAuthUrl: vi.fn(),
  mockActiveAddress: vi.fn<() => string | undefined>(),
}))

vi.mock('uniswap/src/data/apiClients/liquidityService/XVerificationClient', () => ({
  XVerificationClient: { getXAuthUrl: (...args: unknown[]) => mockGetXAuthUrl(...args) },
}))

vi.mock('~/features/accounts/store/hooks', () => ({
  useActiveAddress: () => mockActiveAddress(),
}))

const WALLET = '0x1111111111111111111111111111111111111111'
const AUTH_URL = 'https://x.com/i/oauth2/authorize?state=state-1'

class NoopBroadcastChannel {
  addEventListener(): void {}
  removeEventListener(): void {}
  close(): void {}
}

interface StubPopup {
  closed: boolean
  close: ReturnType<typeof vi.fn>
  location: { replace: ReturnType<typeof vi.fn> }
}

function makePopup(): StubPopup {
  return { closed: false, close: vi.fn(), location: { replace: vi.fn() } }
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (reason: unknown) => void } {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function renderFlow() {
  const store = createCreateAuctionStore()
  return renderHook(() => useXOAuthFlow(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <CreateAuctionStoreContext.Provider value={store}>{children}</CreateAuctionStoreContext.Provider>
    ),
  })
}

describe('useXOAuthFlow connectX', () => {
  let openSpy: MockInstance<typeof window.open>

  beforeEach(() => {
    vi.stubGlobal('BroadcastChannel', NoopBroadcastChannel)
    mockActiveAddress.mockReturnValue(WALLET)
    openSpy = vi.spyOn(window, 'open')
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    mockGetXAuthUrl.mockReset()
  })

  it('opens the popup synchronously, before the auth URL request resolves, then navigates it', async () => {
    const popup = makePopup()
    openSpy.mockReturnValue(popup as unknown as Window)
    const authUrl = deferred<{ authUrl: string; state: string }>()
    mockGetXAuthUrl.mockReturnValue(authUrl.promise)
    const { result } = renderFlow()

    act(() => result.current.connectX())

    // Still inside the tap: the popup exists while the fetch is pending.
    expect(openSpy).toHaveBeenCalledTimes(1)
    expect(openSpy).toHaveBeenCalledWith('', 'x_oauth', 'width=600,height=700')
    expect(mockGetXAuthUrl).toHaveBeenCalledTimes(1)
    expect(popup.location.replace).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      authUrl.resolve({ authUrl: AUTH_URL, state: 'state-1' })
      await authUrl.promise
    })

    expect(popup.location.replace).toHaveBeenCalledWith(AUTH_URL)
    expect(localStorage.getItem('x_oauth_state')).toBe('state-1')
    expect(openSpy).toHaveBeenCalledTimes(1)
    expect(result.current.error).toBeNull()
  })

  it('reports a blocked popup without requesting an auth URL', () => {
    openSpy.mockReturnValue(null)
    const { result } = renderFlow()

    act(() => result.current.connectX())

    expect(mockGetXAuthUrl).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('Popup blocked. Please allow popups for this site.')
  })

  it('closes the placeholder and surfaces the error when the auth URL request fails', async () => {
    const popup = makePopup()
    openSpy.mockReturnValue(popup as unknown as Window)
    mockGetXAuthUrl.mockRejectedValue(new Error('backend down'))
    const { result } = renderFlow()

    await act(async () => {
      result.current.connectX()
    })

    expect(popup.close).toHaveBeenCalledTimes(1)
    expect(popup.location.replace).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('backend down')
  })

  it('does not navigate or store state when the placeholder was closed before the URL arrived', async () => {
    const popup = makePopup()
    openSpy.mockReturnValue(popup as unknown as Window)
    const authUrl = deferred<{ authUrl: string; state: string }>()
    mockGetXAuthUrl.mockReturnValue(authUrl.promise)
    const { result } = renderFlow()

    act(() => result.current.connectX())
    popup.closed = true
    await act(async () => {
      authUrl.resolve({ authUrl: AUTH_URL, state: 'state-1' })
      await authUrl.promise
    })

    expect(popup.location.replace).not.toHaveBeenCalled()
    expect(localStorage.getItem('x_oauth_state')).toBeNull()
  })

  it('ignores a failed auth URL request from a placeholder superseded by a newer tap', async () => {
    const first = makePopup()
    const second = makePopup()
    openSpy.mockReturnValueOnce(first as unknown as Window).mockReturnValueOnce(second as unknown as Window)
    const firstUrl = deferred<{ authUrl: string; state: string }>()
    mockGetXAuthUrl.mockReturnValueOnce(firstUrl.promise).mockReturnValueOnce(new Promise(() => {}))
    const { result } = renderFlow()

    act(() => result.current.connectX())
    first.closed = true
    act(() => result.current.connectX())
    await act(async () => {
      firstUrl.reject(new Error('backend down'))
      await firstUrl.promise.catch(() => {})
    })

    expect(first.close).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('does nothing without a connected wallet', () => {
    mockActiveAddress.mockReturnValue(undefined)
    const { result } = renderFlow()

    act(() => result.current.connectX())

    expect(openSpy).not.toHaveBeenCalled()
    expect(mockGetXAuthUrl).not.toHaveBeenCalled()
  })
})
