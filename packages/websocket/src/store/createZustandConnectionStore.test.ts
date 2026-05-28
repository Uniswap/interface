import { createZustandConnectionStore } from '@universe/websocket/src/store/createZustandConnectionStore'
import { describe, expect, it, vi } from 'vitest'

describe('createZustandConnectionStore', () => {
  describe('initial state', () => {
    it('starts with disconnected status', () => {
      const store = createZustandConnectionStore()
      expect(store.getStatus()).toBe('disconnected')
    })

    it('starts with null connectionId', () => {
      const store = createZustandConnectionStore()
      expect(store.getConnectionId()).toBe(null)
    })

    it('starts with null error', () => {
      const store = createZustandConnectionStore()
      expect(store.getError()).toBe(null)
    })
  })

  describe('setStatus', () => {
    it('updates status to connecting', () => {
      const store = createZustandConnectionStore()
      store.setStatus('connecting')
      expect(store.getStatus()).toBe('connecting')
    })

    it('updates status to connected', () => {
      const store = createZustandConnectionStore()
      store.setStatus('connected')
      expect(store.getStatus()).toBe('connected')
    })

    it('updates status to reconnecting', () => {
      const store = createZustandConnectionStore()
      store.setStatus('reconnecting')
      expect(store.getStatus()).toBe('reconnecting')
    })

    it('updates status to disconnected', () => {
      const store = createZustandConnectionStore()
      store.setStatus('connected')
      store.setStatus('disconnected')
      expect(store.getStatus()).toBe('disconnected')
    })
  })

  describe('setConnectionId', () => {
    it('sets connectionId', () => {
      const store = createZustandConnectionStore()
      store.setConnectionId('test-connection-123')
      expect(store.getConnectionId()).toBe('test-connection-123')
    })

    it('clears connectionId with null', () => {
      const store = createZustandConnectionStore()
      store.setConnectionId('test-connection-123')
      store.setConnectionId(null)
      expect(store.getConnectionId()).toBe(null)
    })
  })

  describe('setError', () => {
    it('sets error', () => {
      const store = createZustandConnectionStore()
      const error = new Error('Connection failed')
      store.setError(error)
      expect(store.getError()).toBe(error)
    })

    it('clears error with null', () => {
      const store = createZustandConnectionStore()
      store.setError(new Error('Connection failed'))
      store.setError(null)
      expect(store.getError()).toBe(null)
    })
  })

  describe('reset', () => {
    it('resets all state to initial values', () => {
      const store = createZustandConnectionStore()

      // Modify all state
      store.setStatus('connected')
      store.setConnectionId('conn-123')
      store.setError(new Error('test'))

      // Reset
      store.reset()

      // Verify all reset
      expect(store.getStatus()).toBe('disconnected')
      expect(store.getConnectionId()).toBe(null)
      expect(store.getError()).toBe(null)
    })
  })

  describe('onStatusChange', () => {
    it('calls callback when status changes', () => {
      const store = createZustandConnectionStore()
      const callback = vi.fn()

      store.onStatusChange(callback)
      store.setStatus('connecting')

      expect(callback).toHaveBeenCalledWith('connecting')
    })

    it('does not call callback when other state changes', () => {
      const store = createZustandConnectionStore()
      const callback = vi.fn()

      store.onStatusChange(callback)
      store.setConnectionId('conn-123')
      store.setError(new Error('test'))

      expect(callback).not.toHaveBeenCalled()
    })

    it('returns unsubscribe function', () => {
      const store = createZustandConnectionStore()
      const callback = vi.fn()

      const unsubscribe = store.onStatusChange(callback)
      store.setStatus('connecting')
      expect(callback).toHaveBeenCalledTimes(1)

      unsubscribe()
      store.setStatus('connected')
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('tracks multiple status transitions', () => {
      const store = createZustandConnectionStore()
      const statuses: string[] = []

      store.onStatusChange((status) => statuses.push(status))
      store.setStatus('connecting')
      store.setStatus('connected')
      store.setStatus('reconnecting')
      store.setStatus('disconnected')

      expect(statuses).toEqual(['connecting', 'connected', 'reconnecting', 'disconnected'])
    })
  })

  describe('options', () => {
    it('creates store without devtools by default', () => {
      const store = createZustandConnectionStore()
      expect(store).toBeDefined()
    })

    it('creates store with custom devtools name', () => {
      const store = createZustandConnectionStore({
        enableDevtools: true,
        devtoolsName: 'customStoreName',
      })
      expect(store).toBeDefined()
    })
  })
})
