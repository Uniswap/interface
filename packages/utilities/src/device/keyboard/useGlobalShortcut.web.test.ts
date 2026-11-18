import { fireEvent, renderHook } from '@testing-library/react'
import { useGlobalShortcut } from 'utilities/src/device/keyboard/useGlobalShortcut.web'
import { afterEach, describe, expect, it, vi } from 'vitest'

function mount(tagName: string, attributes: Record<string, string> = {}): HTMLElement {
  const element = document.createElement(tagName)
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value)
  }
  document.body.appendChild(element)
  return element
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('useGlobalShortcut', () => {
  it('fires for its key on the document and ignores other keys', () => {
    const onTrigger = vi.fn()
    renderHook(() => useGlobalShortcut({ key: '/', onTrigger }))

    fireEvent.keyDown(document.body, { key: 'a' })
    expect(onTrigger).not.toHaveBeenCalled()
    fireEvent.keyDown(document.body, { key: '/' })
    expect(onTrigger).toHaveBeenCalledTimes(1)
  })

  it('matches a printable key case-insensitively, a named key exactly', () => {
    const onR = vi.fn()
    const onEnter = vi.fn()
    renderHook(() => useGlobalShortcut({ key: 'r', onTrigger: onR }))
    renderHook(() => useGlobalShortcut({ key: 'Enter', onTrigger: onEnter }))

    fireEvent.keyDown(document.body, { key: 'R', shiftKey: true })
    expect(onR).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(document.body, { key: 'Enter', shiftKey: true })
    expect(onEnter).not.toHaveBeenCalled()
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(onEnter).toHaveBeenCalledTimes(1)
  })

  it('yields to a key already handled, to IME composition and to key repeat', () => {
    const onTrigger = vi.fn()
    renderHook(() => useGlobalShortcut({ key: 'r', onTrigger }))
    const button = mount('button')
    button.addEventListener('keydown', (event) => event.preventDefault())

    fireEvent.keyDown(button, { key: 'r' })
    fireEvent.keyDown(document.body, { key: 'r', isComposing: true })
    fireEvent.keyDown(document.body, { key: 'r', repeat: true })
    expect(onTrigger).not.toHaveBeenCalled()
  })

  it('requires the modifiers to match exactly', () => {
    const plain = vi.fn()
    const withMeta = vi.fn()
    renderHook(() => useGlobalShortcut({ key: 'r', onTrigger: plain }))
    renderHook(() => useGlobalShortcut({ key: 'r', onTrigger: withMeta, modifiers: { meta: true } }))

    fireEvent.keyDown(document.body, { key: 'r', metaKey: true })
    expect(plain).not.toHaveBeenCalled()
    expect(withMeta).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(document.body, { key: 'r', ctrlKey: true })
    expect(plain).not.toHaveBeenCalled()
    expect(withMeta).toHaveBeenCalledTimes(1)
  })

  it('skips editable targets unless allowed', () => {
    const onTrigger = vi.fn()
    const allowed = vi.fn()
    renderHook(() => useGlobalShortcut({ key: '/', onTrigger }))
    renderHook(() => useGlobalShortcut({ key: '/', onTrigger: allowed, allowInEditable: true }))

    for (const target of [
      mount('input'),
      mount('textarea'),
      mount('select'),
      mount('div', { role: 'combobox' }),
      mount('div', { role: 'searchbox' }),
    ]) {
      fireEvent.keyDown(target, { key: '/' })
    }
    expect(onTrigger).not.toHaveBeenCalled()
    expect(allowed).toHaveBeenCalledTimes(5)
  })

  it('with onlyWhenNothingFocused, a focused control keeps the key', () => {
    const onTrigger = vi.fn()
    renderHook(() => useGlobalShortcut({ key: 'Enter', onTrigger, onlyWhenNothingFocused: true }))
    const button = mount('button')

    button.focus()
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(onTrigger).not.toHaveBeenCalled()
    button.blur()
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(onTrigger).toHaveBeenCalledTimes(1)
  })

  it('prevents the default only when asked, and detaches when disabled or unmounted', () => {
    const onTrigger = vi.fn()
    const { rerender, unmount } = renderHook(
      ({ disabled, preventDefault }: { disabled: boolean; preventDefault: boolean }) =>
        useGlobalShortcut({ key: '/', onTrigger, disabled, preventDefault }),
      { initialProps: { disabled: false, preventDefault: false } },
    )

    expect(fireEvent.keyDown(document.body, { key: '/' })).toBe(true)
    rerender({ disabled: false, preventDefault: true })
    expect(fireEvent.keyDown(document.body, { key: '/' })).toBe(false)
    rerender({ disabled: true, preventDefault: true })
    fireEvent.keyDown(document.body, { key: '/' })
    expect(onTrigger).toHaveBeenCalledTimes(2)
    rerender({ disabled: false, preventDefault: false })
    unmount()
    fireEvent.keyDown(document.body, { key: '/' })
    expect(onTrigger).toHaveBeenCalledTimes(2)
  })

  it('always calls the latest handler without re-subscribing', () => {
    const first = vi.fn()
    const second = vi.fn()
    const addSpy = vi.spyOn(document, 'addEventListener')
    const { rerender } = renderHook(({ onTrigger }) => useGlobalShortcut({ key: '/', onTrigger }), {
      initialProps: { onTrigger: first },
    })
    const subscriptions = addSpy.mock.calls.filter(([type]) => type === 'keydown').length

    rerender({ onTrigger: second })
    fireEvent.keyDown(document.body, { key: '/' })
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
    expect(addSpy.mock.calls.filter(([type]) => type === 'keydown').length).toBe(subscriptions)
    addSpy.mockRestore()
  })
})
