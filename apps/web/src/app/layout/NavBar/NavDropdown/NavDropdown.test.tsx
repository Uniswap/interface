import { act, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { Popover } from 'ui/src'
import { NavDropdown } from '~/app/layout/NavBar/NavDropdown/NavDropdown'
import { render } from '~/test-utils/render'

const VIEWPORT = { width: 414, height: 896 }

function mockPhoneViewport(): void {
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
    const width = query.match(/max-width: (\d+)px/)
    const height = query.match(/max-height: (\d+)px/)
    const matches = width ? VIEWPORT.width <= Number(width[1]) : height ? VIEWPORT.height <= Number(height[1]) : false
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as MediaQueryList
  })
}

function OpenMenu(): JSX.Element {
  const [isOpen, setIsOpen] = useState(true)
  const closeMenu = (): void => setIsOpen(false)
  return (
    <Popover placement="bottom" open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger>
        <span>trigger</span>
      </Popover.Trigger>
      <NavDropdown isOpen={isOpen} onClose={closeMenu}>
        <span>menu row</span>
      </NavDropdown>
    </Popover>
  )
}

function dispatchTouchPointer(target: EventTarget, type: string, clientY: number): void {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientY })
  Object.defineProperty(event, 'pointerType', { value: 'touch' })
  target.dispatchEvent(event)
}

async function openSheetFrame(): Promise<HTMLElement> {
  return waitFor(() => {
    const frame = document.querySelector<HTMLElement>('.uw-sheet-frame')
    expect(frame?.getAttribute('data-state')).toBe('open')
    return frame as HTMLElement
  })
}

describe('NavDropdown (mWeb bottom sheet)', () => {
  beforeEach(() => {
    mockPhoneViewport()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('closes the menu when the sheet is swiped down from its content', async () => {
    render(<OpenMenu />)
    const frame = await openSheetFrame()

    act(() => {
      dispatchTouchPointer(screen.getByText('menu row'), 'pointerdown', 100)
      dispatchTouchPointer(window, 'pointermove', 110)
      dispatchTouchPointer(window, 'pointermove', 400)
      dispatchTouchPointer(window, 'pointerup', 400)
    })

    expect(frame.getAttribute('data-state')).toBe('closed')
  })

  it('keeps the menu open on a tap inside the sheet content', async () => {
    render(<OpenMenu />)
    const frame = await openSheetFrame()

    const row = screen.getByText('menu row')
    act(() => {
      dispatchTouchPointer(row, 'pointerdown', 100)
      dispatchTouchPointer(window, 'pointerup', 100)
    })

    expect(frame.getAttribute('data-state')).toBe('open')
  })
})
