// @vitest-environment jsdom
// jsdom, not the package default: the behavior under test is bound to
// `visibilitychange` / `pageshow` / `online`, which only exist here.
import { MockWebSocket } from '@universe/websocket/src/client/__tests__/MockWebSocket'
import { createWebSocketClient } from '@universe/websocket/src/client/createWebSocketClient'
import { createZustandConnectionStore } from '@universe/websocket/src/store/createZustandConnectionStore'
import type { WebSocketClient } from '@universe/websocket/src/types'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

/**
 * The lifetime contract across an app switch.
 *
 * partysocket spends its whole `maxRetries` budget in well under a minute, and
 * a suspended page spends it offline — so a tab held open across a background
 * stretch comes back to a socket that has permanently given up. Worse,
 * partysocket (1.1.10) leaves `_connectLock` set when `_connect` bails on the
 * exhausted budget, so `reconnect()` on that instance is a silent no-op: the
 * only way back is a NEW socket. These tests pin that, that the subscription
 * registry survives the swap (the React effects owning those subscriptions
 * never re-run, so `resubscribeAll` is the only thing that can restore them),
 * and that reviving stays rate-limited — otherwise `maxRetries` stops being a
 * ceiling at all.
 */
interface Harness {
  client: WebSocketClient<{ channel: string; id: string }, { data: string }>
  sockets: MockWebSocket[]
  handler: {
    subscribe: Mock
    unsubscribe: Mock
    subscribeBatch: Mock
    unsubscribeBatch: Mock
  }
}

/** Unlike testUtils' single-socket harness, every connect gets a FRESH socket —
 * which is the thing being asserted. */
function createHarness(): Harness {
  const sockets: MockWebSocket[] = []
  const handler = {
    subscribe: vi.fn().mockResolvedValue(undefined),
    unsubscribe: vi.fn().mockResolvedValue(undefined),
    subscribeBatch: vi.fn().mockResolvedValue(undefined),
    unsubscribeBatch: vi.fn().mockResolvedValue(undefined),
  }
  const client = createWebSocketClient<{ channel: string; id: string }, { data: string }>({
    config: { url: 'wss://test.example.com' },
    connectionStore: createZustandConnectionStore(),
    subscriptionHandler: handler,
    parseMessage: () => null,
    parseConnectionMessage: (raw) => {
      const msg = raw as { type?: string; connectionId?: string }
      return msg.type === 'connected' && msg.connectionId ? { connectionId: msg.connectionId } : null
    },
    createSubscriptionKey: (channel, params) => `${channel}:${params.id}`,
    socketFactory: () => {
      const socket = new MockWebSocket()
      sockets.push(socket)
      return socket
    },
  })
  return { client, sockets, handler }
}

function setVisibility(state: 'visible' | 'hidden'): void {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

/** The revive swap is deliberately jittered (shared triggers, many tabs), so a
 * microtask flush is not enough to observe it — advance past the window. */
const REVIVE_JITTER_MS = 2_000
const REVIVE_COOLDOWN_MS = 30_000
const settle = async (): Promise<void> => {
  await vi.advanceTimersByTimeAsync(REVIVE_JITTER_MS + 100)
}

/** Subscribes, opens the socket and completes the handshake. */
async function connectHarness(h: Harness, connectionId = 'conn-1'): Promise<() => void> {
  const unsub = h.client.subscribe({
    channel: 'price',
    params: { channel: 'price', id: 'tok' },
    onMessage: vi.fn(),
  })
  await vi.advanceTimersByTimeAsync(0)
  const socket = h.sockets[h.sockets.length - 1]
  socket?.simulateOpen()
  socket?.simulateMessage({ type: 'connected', connectionId })
  await vi.advanceTimersByTimeAsync(0)
  return unsub
}

beforeEach(() => {
  vi.useFakeTimers()
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
})

afterEach(() => {
  // Unconditionally, not at the end of a test body: an assertion that throws
  // would otherwise leak fake timers into every test after it, and the failure
  // would then surface somewhere unrelated.
  vi.useRealTimers()
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
})

describe('websocket revival after a backgrounded tab', () => {
  it('replaces a socket that gave up while hidden, and resubscribes on it', async () => {
    const h = createHarness()
    const unsub = await connectHarness(h)
    expect(h.sockets).toHaveLength(1)
    expect(h.client.isConnected()).toBe(true)

    // Hidden; the socket closes and partysocket burns its retry budget offline.
    setVisibility('hidden')
    h.sockets[0]?.simulateClose(1006, 'abnormal')
    expect(h.client.isConnected()).toBe(false)

    // Back in the foreground: a NEW socket, because the exhausted one cannot
    // be revived.
    setVisibility('visible')
    await settle()
    expect(h.sockets).toHaveLength(2)

    h.sockets[1]?.simulateOpen()
    h.sockets[1]?.simulateMessage({ type: 'connected', connectionId: 'conn-2' })
    await vi.advanceTimersByTimeAsync(0)
    expect(h.client.isConnected()).toBe(true)
    // The registry survived the swap, so the price room is live again.
    expect(h.handler.subscribeBatch).toHaveBeenCalledWith('conn-2', [{ channel: 'price', id: 'tok' }])

    unsub()
  })

  it('revives on an `online` event too', async () => {
    const h = createHarness()
    const unsub = await connectHarness(h)
    h.sockets[0]?.simulateClose(1006, 'offline')

    window.dispatchEvent(new Event('online'))
    await settle()
    expect(h.sockets).toHaveLength(2)

    unsub()
  })

  it('revives across a bfcache restore, where visibilitychange may not fire', async () => {
    const h = createHarness()
    const unsub = await connectHarness(h)
    h.sockets[0]?.simulateClose(1006, 'suspended')

    window.dispatchEvent(new Event('pageshow'))
    await settle()
    expect(h.sockets).toHaveLength(2)

    unsub()
  })

  /**
   * The rate limit is the whole reason `maxRetries` still means something. A
   * fresh socket restarts the ladder at retry 0 — whose first attempt is
   * IMMEDIATE — so an unthrottled revive turns a per-page ceiling into a
   * per-event one, and a flapping network is exactly when that matters.
   */
  it('rate-limits revival, so a flapping trigger cannot restart the ladder repeatedly', async () => {
    const h = createHarness()
    const unsub = await connectHarness(h)
    h.sockets[0]?.simulateClose(1006, 'down')

    setVisibility('visible')
    await settle()
    expect(h.sockets).toHaveLength(2)

    // The gateway is still down; the user cycles tabs and the network flaps.
    for (let i = 0; i < 8; i += 1) {
      h.sockets[h.sockets.length - 1]?.simulateClose(1006, 'still down')
      setVisibility('hidden')
      setVisibility('visible')
      window.dispatchEvent(new Event('online'))
      await vi.advanceTimersByTimeAsync(1_000)
    }
    expect(h.sockets).toHaveLength(2)

    unsub()
  })

  it('revives again once the cooldown has elapsed', async () => {
    const h = createHarness()
    const unsub = await connectHarness(h)
    h.sockets[0]?.simulateClose(1006, 'down')
    setVisibility('visible')
    await settle()
    expect(h.sockets).toHaveLength(2)

    h.sockets[1]?.simulateClose(1006, 'still down')
    await vi.advanceTimersByTimeAsync(REVIVE_COOLDOWN_MS)
    setVisibility('visible')
    await settle()
    expect(h.sockets).toHaveLength(3)

    unsub()
  })

  it('leaves a healthy socket alone on a plain app switch', async () => {
    const h = createHarness()
    const unsub = await connectHarness(h)

    setVisibility('hidden')
    setVisibility('visible')
    await settle()
    expect(h.sockets).toHaveLength(1)
    expect(h.sockets[0]?.closeCalls).toBe(0)

    unsub()
  })

  it('respects an overload hold rather than reconnecting into a shed', async () => {
    const h = createHarness()
    const unsub = await connectHarness(h)

    // 1013 = try again later: the client parks the socket for a long hold.
    setVisibility('hidden')
    h.sockets[0]?.simulateClose(1013, 'try again later')
    setVisibility('visible')
    await settle()
    expect(h.sockets).toHaveLength(1)

    unsub()
  })

  it('does not revive after the last subscriber leaves', async () => {
    const h = createHarness()
    const unsub = await connectHarness(h)

    // The last unsubscribe tears the socket down (after the 2s nav debounce);
    // an app switch after that must not resurrect it.
    unsub()
    await vi.advanceTimersByTimeAsync(2_500)

    setVisibility('hidden')
    setVisibility('visible')
    window.dispatchEvent(new Event('online'))
    await settle()
    expect(h.sockets).toHaveLength(1)
  })
})
