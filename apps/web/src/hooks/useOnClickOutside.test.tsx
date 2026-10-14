import { fireEvent, render, screen } from '@testing-library/react'
import { type RefObject, useRef } from 'react'
import { useOnClickOutside } from '~/hooks/useOnClickOutside'

function Harness({
  handler,
  ignoreDialogClicks,
  useIgnoredNode,
}: {
  handler?: () => void
  ignoreDialogClicks?: boolean
  useIgnoredNode?: boolean
}): JSX.Element {
  const node = useRef<HTMLDivElement>(null)
  const ignored = useRef<HTMLDivElement>(null)
  const ignoredNodes = useIgnoredNode ? [ignored as RefObject<HTMLElement>] : undefined
  useOnClickOutside({ node, handler, ignoredNodes, ignoreDialogClicks })
  return (
    <>
      <div ref={node}>
        <button data-testid="inside">inside</button>
      </div>
      <div ref={ignored}>
        <button data-testid="ignored">ignored</button>
      </div>
      <div role="dialog">
        <button data-testid="dialog">dialog</button>
      </div>
      <button data-testid="outside" onMouseDown={(e) => e.stopPropagation()}>
        outside
      </button>
    </>
  )
}

describe('useOnClickOutside', () => {
  it('ignores mousedown inside the node', () => {
    const handler = vi.fn()
    render(<Harness handler={handler} />)
    fireEvent.mouseDown(screen.getByTestId('inside'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('fires on an outside mousedown even when the target stops propagation', () => {
    const handler = vi.fn()
    render(<Harness handler={handler} />)
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not fire on click, only mousedown', () => {
    const handler = vi.fn()
    render(<Harness handler={handler} />)
    fireEvent.click(screen.getByTestId('outside'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('ignores mousedown inside ignoredNodes', () => {
    const handler = vi.fn()
    render(<Harness handler={handler} useIgnoredNode />)
    fireEvent.mouseDown(screen.getByTestId('ignored'))
    expect(handler).not.toHaveBeenCalled()
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('ignores dialog clicks only when ignoreDialogClicks is set', () => {
    const handler = vi.fn()
    const { rerender } = render(<Harness handler={handler} ignoreDialogClicks />)
    fireEvent.mouseDown(screen.getByTestId('dialog'))
    expect(handler).not.toHaveBeenCalled()

    rerender(<Harness handler={handler} ignoreDialogClicks={false} />)
    fireEvent.mouseDown(screen.getByTestId('dialog'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('treats a mousedown within the node bounding rect as inside, for portaled content', () => {
    const handler = vi.fn()
    render(<Harness handler={handler} />)
    const node = screen.getByTestId('inside').parentElement as HTMLElement
    vi.spyOn(node, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    fireEvent.mouseDown(screen.getByTestId('outside'), { clientX: 50, clientY: 50 })
    expect(handler).not.toHaveBeenCalled()
    fireEvent.mouseDown(screen.getByTestId('outside'), { clientX: 150, clientY: 150 })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('calls the latest handler after a rerender', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = render(<Harness handler={first} />)
    rerender(<Harness handler={second} />)
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('is a no-op without a handler', () => {
    render(<Harness />)
    expect(() => fireEvent.mouseDown(screen.getByTestId('outside'))).not.toThrow()
  })

  it('removes the capture listener on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const { unmount } = render(<Harness handler={vi.fn()} />)
    removeSpy.mockClear()
    unmount()
    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), { capture: true })
    removeSpy.mockRestore()
  })
})
