import { describe, expect, it, vi } from 'vitest'
import { createExperimentsStore } from './store'

describe('createExperimentsStore', () => {
  it('adds a new experiment and exposes it via get/getSnapshot', () => {
    const store = createExperimentsStore()
    store.set('exp', { groupName: 'treatment', value: { a: 1 } })

    expect(store.get('exp')).toEqual({ groupName: 'treatment', value: { a: 1 } })
    expect(store.getSnapshot()).toEqual({ exp: { groupName: 'treatment', value: { a: 1 } } })
  })

  it('keeps a stable snapshot reference until contents change', () => {
    const store = createExperimentsStore()
    const empty = store.getSnapshot()
    expect(store.getSnapshot()).toBe(empty)

    store.set('exp', { value: { a: 1 } })
    const afterWrite = store.getSnapshot()
    expect(afterWrite).not.toBe(empty)
    expect(store.getSnapshot()).toBe(afterWrite)
  })

  it('notifies subscribers on change and supports unsubscribe', () => {
    const store = createExperimentsStore()
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)

    store.set('exp', { value: { a: 1 } })
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    store.set('other', { value: { b: 2 } })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  describe('write semantics', () => {
    it('is idempotent for an identical re-write (no notify, no collision)', () => {
      const onCollision = vi.fn()
      const store = createExperimentsStore({ onCollision })
      const listener = vi.fn()
      store.subscribe(listener)

      store.set('exp', { groupName: 'treatment', value: { a: 1 } })
      store.set('exp', { groupName: 'treatment', value: { a: 1 } })

      expect(listener).toHaveBeenCalledTimes(1)
      expect(onCollision).not.toHaveBeenCalled()
    })

    it('treats a missing groupName and explicit null as equal', () => {
      const onCollision = vi.fn()
      const store = createExperimentsStore({ onCollision })

      store.set('exp', { value: { a: 1 } })
      store.set('exp', { groupName: null, value: { a: 1 } })

      expect(onCollision).not.toHaveBeenCalled()
    })

    it('first write wins and reports a collision on a conflicting value', () => {
      const onCollision = vi.fn()
      const store = createExperimentsStore({ onCollision })

      store.set('exp', { groupName: 'treatment', value: { a: 1 } })
      store.set('exp', { groupName: 'control', value: { a: 2 } })

      expect(store.get('exp')).toEqual({ groupName: 'treatment', value: { a: 1 } })
      expect(onCollision).toHaveBeenCalledTimes(1)
      expect(onCollision).toHaveBeenCalledWith({
        name: 'exp',
        existing: { groupName: 'treatment', value: { a: 1 } },
        incoming: { groupName: 'control', value: { a: 2 } },
        source: 'set',
      })
    })

    it('passes the collision source through', () => {
      const onCollision = vi.fn()
      const store = createExperimentsStore({ onCollision })

      store.set('exp', { value: { a: 1 } })
      store.merge({ exp: { value: { a: 2 } } })

      expect(onCollision).toHaveBeenCalledWith(expect.objectContaining({ source: 'absorb' }))
    })
  })

  describe('merge', () => {
    it('adds all new entries and notifies once', () => {
      const store = createExperimentsStore()
      const listener = vi.fn()
      store.subscribe(listener)

      store.merge({ a: { value: { x: 1 } }, b: { value: { y: 2 } } })

      expect(store.getSnapshot()).toEqual({ a: { value: { x: 1 } }, b: { value: { y: 2 } } })
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('does not notify when nothing changed', () => {
      const store = createExperimentsStore()
      store.set('a', { value: { x: 1 } })
      const listener = vi.fn()
      store.subscribe(listener)

      store.merge({ a: { value: { x: 1 } } })

      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('clear', () => {
    it('empties the store and notifies', () => {
      const store = createExperimentsStore()
      store.set('a', { value: { x: 1 } })
      const listener = vi.fn()
      store.subscribe(listener)

      store.clear()

      expect(store.getSnapshot()).toEqual({})
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('is a no-op on an already-empty store', () => {
      const store = createExperimentsStore()
      const listener = vi.fn()
      store.subscribe(listener)

      store.clear()

      expect(listener).not.toHaveBeenCalled()
    })
  })
})
