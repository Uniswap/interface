import { withConnectionGoneDetection } from '@universe/websocket/src/client/withConnectionGoneDetection'
import { ConnectionGoneError } from '@universe/websocket/src/errors'
import type { SubscriptionHandler } from '@universe/websocket/src/types'
import { describe, expect, it, vi } from 'vitest'

const GONE = new ConnectionGoneError('conn-1')
const OTHER = new Error('other')

function setup(refresh: SubscriptionHandler<string>['refreshSession']) {
  const onConnectionGone = vi.fn()
  const handler = withConnectionGoneDetection<string>(
    {
      subscribe: vi.fn().mockResolvedValue(undefined),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
      refreshSession: refresh,
    },
    onConnectionGone,
  )
  return { handler, onConnectionGone }
}

describe('withConnectionGoneDetection', () => {
  it('reports a connection after consecutive gone failures, and keeps reporting', async () => {
    const { handler, onConnectionGone } = setup(vi.fn().mockRejectedValue(GONE))

    await expect(handler.refreshSession?.('conn-1')).rejects.toBe(GONE)
    expect(onConnectionGone).not.toHaveBeenCalled()

    await expect(handler.refreshSession?.('conn-1')).rejects.toBe(GONE)
    await expect(handler.refreshSession?.('conn-1')).rejects.toBe(GONE)
    expect(onConnectionGone).toHaveBeenCalledTimes(2)
    expect(onConnectionGone).toHaveBeenCalledWith('conn-1')
  })

  it('resets the count on success', async () => {
    const refresh = vi.fn().mockRejectedValueOnce(GONE).mockResolvedValueOnce(undefined).mockRejectedValueOnce(GONE)
    const { handler, onConnectionGone } = setup(refresh)

    await expect(handler.refreshSession?.('conn-1')).rejects.toBe(GONE)
    await handler.refreshSession?.('conn-1')
    await expect(handler.refreshSession?.('conn-1')).rejects.toBe(GONE)
    expect(onConnectionGone).not.toHaveBeenCalled()
  })

  it('ignores other failures and counts each connection separately', async () => {
    const refresh = vi.fn().mockRejectedValueOnce(OTHER).mockRejectedValueOnce(GONE).mockRejectedValueOnce(GONE)
    const { handler, onConnectionGone } = setup(refresh)

    await expect(handler.refreshSession?.('conn-1')).rejects.toBe(OTHER)
    await expect(handler.refreshSession?.('conn-1')).rejects.toBe(GONE)
    await expect(handler.refreshSession?.('conn-2')).rejects.toBe(GONE)
    expect(onConnectionGone).not.toHaveBeenCalled()
  })

  it('leaves optional methods absent when the handler lacks them', () => {
    const { handler } = setup(undefined)
    expect(handler.refreshSession).toBeUndefined()
    expect(handler.subscribeBatch).toBeUndefined()
  })
})
