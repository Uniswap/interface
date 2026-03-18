import { fireEvent, renderHook } from '@testing-library/react'
import { KeyAction } from 'utilities/src/device/keyboard/types'
import { useKeyDown } from 'utilities/src/device/keyboard/useKeyDown.web'
import { type Mock, type MockInstance, vi } from 'vitest'

describe('useKeyDown', () => {
  let callback: Mock
  let addEventListenerSpy: MockInstance

  beforeEach(() => {
    callback = vi.fn()
    addEventListenerSpy = vi.spyOn(document, 'addEventListener')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should not add event listener when disabled', () => {
    renderHook(() =>
      useKeyDown({
        callback,
        keys: ['Escape'],
        disabled: true,
      }),
    )

    expect(addEventListenerSpy).not.toHaveBeenCalledWith(KeyAction.DOWN, expect.any(Function))
    expect(addEventListenerSpy).not.toHaveBeenCalledWith(KeyAction.UP, expect.any(Function))
  })

  it('should call callback when key is pressed', () => {
    const div = document.createElement('div')
    document.body.appendChild(div)

    renderHook(() =>
      useKeyDown({
        callback,
        keys: ['Escape'],
      }),
    )

    fireEvent.keyDown(div, { key: 'Escape' })

    expect(callback).toHaveBeenCalled()
  })

  it('should not call callback when different key is pressed', () => {
    const div = document.createElement('div')
    document.body.appendChild(div)

    renderHook(() =>
      useKeyDown({
        callback,
        keys: ['Escape'],
      }),
    )

    fireEvent.keyDown(div, { key: 'F' })

    expect(callback).not.toHaveBeenCalled()
  })

  it('should not trigger in input elements by default', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    renderHook(() =>
      useKeyDown({
        callback,
        keys: ['Escape'],
      }),
    )

    fireEvent.keyDown(input, { key: 'Escape' })

    expect(callback).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })

  it('should trigger in input elements when shouldTriggerInInput is true', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    renderHook(() =>
      useKeyDown({
        callback,
        keys: ['Escape'],
        shouldTriggerInInput: true,
      }),
    )

    fireEvent.keyDown(input, { key: 'Escape' })

    expect(callback).toHaveBeenCalled()
    document.body.removeChild(input)
  })

  it('should use custom key action when provided', () => {
    const div = document.createElement('div')
    document.body.appendChild(div)

    renderHook(() =>
      useKeyDown({
        callback,
        keys: ['Escape'],
        keyAction: KeyAction.UP,
      }),
    )

    fireEvent.keyUp(div, { key: 'Escape' })
    expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function))
  })
})
