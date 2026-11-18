import { fireEvent, renderHook } from '@testing-library/react'
import { markRadixEscapePreventedBySheet, useDismissLayer } from 'utilities/src/react/useDismissLayer.web'
import { describe, expect, it, vi } from 'vitest'

describe('useDismissLayer', () => {
  it('closes an open layer on Escape and nothing else', () => {
    const onClose = vi.fn()
    renderHook(() => useDismissLayer({ isOpen: true, onClose }))

    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(onClose).not.toHaveBeenCalled()
    expect(fireEvent.keyDown(document.body, { key: 'Escape' })).toBe(false)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ignores Escape while closed, and detaches on unmount', () => {
    const onClose = vi.fn()
    const { rerender, unmount } = renderHook(({ isOpen }) => useDismissLayer({ isOpen, onClose }), {
      initialProps: { isOpen: false },
    })

    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
    rerender({ isOpen: true })
    unmount()
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes only the top open layer, then the next one', () => {
    const closeBottom = vi.fn()
    const closeTop = vi.fn()
    renderHook(() => useDismissLayer({ isOpen: true, onClose: closeBottom }))
    const top = renderHook(({ isOpen }) => useDismissLayer({ isOpen, onClose: closeTop }), {
      initialProps: { isOpen: true },
    })

    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(closeTop).toHaveBeenCalledTimes(1)
    expect(closeBottom).not.toHaveBeenCalled()

    top.rerender({ isOpen: false })
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(closeBottom).toHaveBeenCalledTimes(1)
  })

  it('yields to an Escape a real inner layer already handled, and to IME composition', () => {
    const onClose = vi.fn()
    renderHook(() => useDismissLayer({ isOpen: true, onClose }))
    const dialog = document.createElement('div')
    document.body.appendChild(dialog)
    dialog.addEventListener('keydown', (event) => event.preventDefault())

    fireEvent.keyDown(dialog, { key: 'Escape' })
    fireEvent.keyDown(document.body, { key: 'Escape', isComposing: true })
    fireEvent.keyDown(document.body, { key: 'Escape', keyCode: 229 })
    expect(onClose).not.toHaveBeenCalled()
    dialog.remove()
  })

  it('still closes when only sheet chrome marked the Escape', () => {
    const onClose = vi.fn()
    renderHook(() => useDismissLayer({ isOpen: true, onClose }))
    const sheet = document.createElement('div')
    document.body.appendChild(sheet)
    sheet.addEventListener('keydown', (event) => markRadixEscapePreventedBySheet(event))

    fireEvent.keyDown(sheet, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    sheet.remove()
  })

  it('calls the latest onClose', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(({ onClose }) => useDismissLayer({ isOpen: true, onClose }), {
      initialProps: { onClose: first },
    })

    rerender({ onClose: second })
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
