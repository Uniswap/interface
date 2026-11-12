import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useScreenSendOnPress } from '~/pages/Swap/Send/useScreenSendOnPress'

const { mockFetchIsBlockedAddress } = vi.hoisted(() => ({ mockFetchIsBlockedAddress: vi.fn() }))

// Keep the real `toScreenInput` so the screen receives production inputs.
vi.mock('@universe/compliance', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/compliance')>()),
  useComplianceClient: () => ({}),
  fetchIsBlockedAddress: (...args: unknown[]) => mockFetchIsBlockedAddress(...args),
}))

const SENDER = '0x1111111111111111111111111111111111111111'
const RECIPIENT = '0x2222222222222222222222222222222222222222'
const OTHER_RECIPIENT = '0x3333333333333333333333333333333333333333'
const CHAIN_ID = 1

type ScreenSendProps = Parameters<typeof useScreenSendOnPress>[0]

function wrapper({ children }: PropsWithChildren): JSX.Element {
  const queryClient = new QueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function renderScreenSend(): ReturnType<typeof renderHook<ReturnType<typeof useScreenSendOnPress>, unknown>> {
  return renderHook(
    () => useScreenSendOnPress({ senderAddress: SENDER, recipientAddress: RECIPIENT, chainId: CHAIN_ID }),
    { wrapper },
  )
}

/** Renders with props that a later `rerender` can change, as the form's own would. */
function renderScreenSendWithProps(
  initialProps: ScreenSendProps,
): ReturnType<typeof renderHook<ReturnType<typeof useScreenSendOnPress>, ScreenSendProps>> {
  return renderHook((props: ScreenSendProps) => useScreenSendOnPress(props), { wrapper, initialProps })
}

/** Holds every screen open, so a press can be inspected mid-flight. */
function holdScreens(): { settleAll: (isBlocked: boolean) => Promise<void> } {
  const pending: ((isBlocked: boolean) => void)[] = []
  mockFetchIsBlockedAddress.mockImplementation(() => new Promise<boolean>((resolve) => pending.push(resolve)))
  return {
    settleAll: async (isBlocked: boolean): Promise<void> => {
      await act(async () => {
        pending.forEach((resolve) => resolve(isBlocked))
      })
    },
  }
}

/** Resolves each address's screen by its address. */
function blockAddresses(...blocked: string[]): void {
  mockFetchIsBlockedAddress.mockImplementation((input?: { address: string }) =>
    Promise.resolve(!!input && blocked.includes(input.address)),
  )
}

describe('useScreenSendOnPress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    onlineManager.setOnline(true)
  })

  it('sends when neither party is blocked', async () => {
    blockAddresses()
    const onClear = vi.fn()
    const { result } = renderScreenSend()

    result.current.screenSend(onClear)

    await waitFor(() => expect(onClear).toHaveBeenCalledTimes(1))
    expect(result.current.isBlocked).toBe(false)
  })

  it('screens the sender and the recipient on one press', async () => {
    blockAddresses()
    const { result } = renderScreenSend()

    result.current.screenSend(vi.fn())

    await waitFor(() => expect(mockFetchIsBlockedAddress).toHaveBeenCalledTimes(2))
    const screened = mockFetchIsBlockedAddress.mock.calls.map(([input]) => input?.address)
    expect(screened).toEqual([SENDER, RECIPIENT])
  })

  it('names the sender and does not send when the sender is blocked', async () => {
    blockAddresses(SENDER)
    const onClear = vi.fn()
    const { result } = renderScreenSend()

    result.current.screenSend(onClear)

    await waitFor(() => expect(result.current.isBlocked).toBe(true))
    expect(result.current.blockedAddress).toBe(SENDER)
    expect(onClear).not.toHaveBeenCalled()
  })

  it('names the recipient and does not send when the recipient is blocked', async () => {
    blockAddresses(RECIPIENT)
    const onClear = vi.fn()
    const { result } = renderScreenSend()

    result.current.screenSend(onClear)

    await waitFor(() => expect(result.current.isBlocked).toBe(true))
    expect(result.current.blockedAddress).toBe(RECIPIENT)
    expect(onClear).not.toHaveBeenCalled()
  })

  it('names the sender when both parties are blocked', async () => {
    blockAddresses(SENDER, RECIPIENT)
    const { result } = renderScreenSend()

    result.current.screenSend(vi.fn())

    await waitFor(() => expect(result.current.isBlocked).toBe(true))
    expect(result.current.blockedAddress).toBe(SENDER)
  })

  // `useMutation` defaults to `networkMode: 'online'`, which would park the press until
  // reconnect instead of letting it settle and fail open.
  it('settles the press while offline', async () => {
    onlineManager.setOnline(false)
    blockAddresses()
    const onClear = vi.fn()
    const { result } = renderScreenSend()

    result.current.screenSend(onClear)

    await waitFor(() => expect(onClear).toHaveBeenCalledTimes(1))
  })

  it('reports a screen in flight so the button can show a loader', async () => {
    const screens = holdScreens()
    const { result } = renderScreenSendWithProps({
      senderAddress: SENDER,
      recipientAddress: RECIPIENT,
      chainId: CHAIN_ID,
    })

    expect(result.current.isScreening).toBe(false)
    act(() => result.current.screenSend(vi.fn()))
    await waitFor(() => expect(result.current.isScreening).toBe(true))

    await screens.settleAll(false)

    await waitFor(() => expect(result.current.isScreening).toBe(false))
  })

  // The recipient field stays editable while the screen runs, so a verdict for the old
  // recipient must not clear a send that would now go somewhere unscreened.
  it('does not send on a verdict for a recipient the form has moved past', async () => {
    const screens = holdScreens()
    const onClear = vi.fn()
    const { result, rerender } = renderScreenSendWithProps({
      senderAddress: SENDER,
      recipientAddress: RECIPIENT,
      chainId: CHAIN_ID,
    })

    act(() => result.current.screenSend(onClear))
    // Both screens have to be in flight before the recipient changes, or `settleAll` has
    // nothing to resolve and the press never settles.
    await waitFor(() => expect(mockFetchIsBlockedAddress).toHaveBeenCalledTimes(2))
    rerender({ senderAddress: SENDER, recipientAddress: OTHER_RECIPIENT, chainId: CHAIN_ID })
    await screens.settleAll(false)

    // The screen did settle, so it is the stale-pair guard holding the send back and not
    // a press still in flight.
    await waitFor(() => expect(result.current.isScreening).toBe(false))
    expect(onClear).not.toHaveBeenCalled()
    expect(result.current.isBlocked).toBe(false)
  })

  it('clears the block once the user dismisses it', async () => {
    blockAddresses(SENDER)
    const { result } = renderScreenSend()

    result.current.screenSend(vi.fn())
    await waitFor(() => expect(result.current.isBlocked).toBe(true))

    act(() => result.current.dismissBlocked())

    await waitFor(() => expect(result.current.isBlocked).toBe(false))
  })
})
