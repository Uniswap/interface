import { afterEach, describe, expect, it, vi } from 'vitest'
// @vitest-environment jsdom
import { getRootThemeSnapshot, getServerThemeSnapshot, subscribeToRootTheme } from './theme-state'

async function flushMutationObservers(): Promise<void> {
  // MutationObserver callbacks are delivered as microtasks
  await Promise.resolve()
}

describe('themeState root-class store', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark', 'light')
  })

  it('snapshots light without the dark class and dark with it', () => {
    expect(getRootThemeSnapshot()).toBe('light')
    document.documentElement.classList.add('dark')
    expect(getRootThemeSnapshot()).toBe('dark')
  })

  it('always snapshots light on the server', () => {
    expect(getServerThemeSnapshot()).toBe('light')
  })

  it('notifies subscribers on root class changes and stops after unsubscribe', async () => {
    const onChange = vi.fn()
    const unsubscribe = subscribeToRootTheme(onChange)

    document.documentElement.classList.add('dark')
    await flushMutationObservers()
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(getRootThemeSnapshot()).toBe('dark')

    unsubscribe()
    document.documentElement.classList.remove('dark')
    await flushMutationObservers()
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('supports multiple subscribers with independent unsubscription', async () => {
    const first = vi.fn()
    const second = vi.fn()
    const unsubscribeFirst = subscribeToRootTheme(first)
    const unsubscribeSecond = subscribeToRootTheme(second)

    document.documentElement.classList.add('dark')
    await flushMutationObservers()
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)

    unsubscribeFirst()
    document.documentElement.classList.remove('dark')
    await flushMutationObservers()
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(2)
    unsubscribeSecond()
  })
})
