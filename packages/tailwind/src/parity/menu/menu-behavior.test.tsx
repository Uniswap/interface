// @vitest-environment jsdom
/**
 * Behavior contract for the Base-UI-backed menu-family compat (INFRA-3021):
 * the legacy ContextMenu.web.tsx runtime semantics the CSS matrices cannot
 * prove — controlled open state and trigger modes, the `openAt` imperative
 * handle, the dismiss microbehavior (capture-phase outside listener, mouseup
 * for Primary vs mousedown for Secondary, one-shot suppression of a
 * right-click's trailing mouseup), item press semantics (stopPropagation,
 * closeDelay), the telemetry adapter seam, and the in-modal overlay z-index
 * re-homing that keeps menus above a z-1060 modal.
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createRef, type JSX, type RefObject, useContext, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import {
  ContextMenuCompat,
  type ContextMenuCompatHandle,
  type ContextMenuCompatProps,
  DropdownMenuSheetItemCompat,
  MenuContentCompat,
  type MenuOptionItemCompat,
  type MenuTelemetryAdapter,
} from '../../../../mycelium/src/menu-compat'
// nx-ignore-next-line
import { EffectiveOverlayZIndexContext, OVERLAY_Z_INDEXES } from '../../../../mycelium/src/popover-compat/z-index'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const TRIGGER_SELECTOR = '[data-slot="context-menu-compat-trigger"]'
const POSITIONER_SELECTOR = '[data-slot="context-menu-compat-positioner"]'
const POPUP_SELECTOR = '[data-slot="context-menu-compat-popup"]'

interface Spies {
  openMenu: ReturnType<typeof vi.fn>
  closeMenu: ReturnType<typeof vi.fn>
}

function createSpies(): Spies {
  return { openMenu: vi.fn(), closeMenu: vi.fn() }
}

function defaultItems(overrides: Partial<MenuOptionItemCompat>[] = []): MenuOptionItemCompat[] {
  const base: MenuOptionItemCompat[] = [
    { label: 'First', onPress: vi.fn() },
    { label: 'Second', onPress: vi.fn(), showDivider: true },
    { label: 'Danger', onPress: vi.fn(), destructive: true },
    { label: 'Off', onPress: vi.fn(), disabled: true },
  ]
  return base.map((item, index) => ({ ...item, ...overrides[index] }))
}

interface HarnessProps extends Partial<Omit<ContextMenuCompatProps, 'isOpen' | 'closeMenu' | 'openMenu'>> {
  spies: Spies
  items?: MenuOptionItemCompat[]
  initialOpen?: boolean
  withoutOpenMenu?: boolean
  menuRef?: RefObject<ContextMenuCompatHandle | null>
}

function StatefulMenu({
  spies,
  items = defaultItems(),
  initialOpen = false,
  withoutOpenMenu = false,
  menuRef,
  ...overrides
}: HarnessProps): JSX.Element {
  const [isOpen, setOpen] = useState(initialOpen)
  const openMenu = (): void => {
    spies.openMenu()
    setOpen(true)
  }
  const closeMenu = (): void => {
    spies.closeMenu()
    setOpen(false)
  }
  return (
    <ContextMenuCompat
      ref={menuRef}
      menuItems={items}
      triggerMode="secondary"
      isOpen={isOpen}
      closeMenu={closeMenu}
      openMenu={withoutOpenMenu ? undefined : openMenu}
      {...overrides}
    >
      <button type="button">trigger</button>
    </ContextMenuCompat>
  )
}

function trigger(): HTMLElement {
  const node = document.querySelector(TRIGGER_SELECTOR)
  if (!(node instanceof HTMLElement)) {
    throw new Error('trigger container not rendered')
  }
  return node
}

describe('ContextMenuCompat — trigger modes and controlled open state', () => {
  it('secondary mode opens on right-click (contextmenu), prevents the native menu, and toggles closed on a second right-click', () => {
    const spies = createSpies()
    render(<StatefulMenu spies={spies} />)
    expect(document.querySelector(POPUP_SELECTOR)).toBeNull()

    const event = fireEvent.contextMenu(trigger())
    expect(spies.openMenu).toHaveBeenCalledTimes(1)
    expect(event).toBe(false) // preventDefault was called
    expect(document.querySelector(POPUP_SELECTOR)).toBeTruthy()

    fireEvent.contextMenu(trigger())
    expect(spies.closeMenu).toHaveBeenCalledTimes(1)
    expect(document.querySelector(POPUP_SELECTOR)).toBeNull()
  })

  it('primary mode opens on trigger mousedown, toggles closed on a second mousedown, and suppresses the native context menu without opening', () => {
    const spies = createSpies()
    render(<StatefulMenu spies={spies} triggerMode="primary" />)

    fireEvent.mouseDown(trigger())
    expect(spies.openMenu).toHaveBeenCalledTimes(1)
    expect(document.querySelector(POPUP_SELECTOR)).toBeTruthy()

    fireEvent.mouseDown(trigger())
    expect(spies.closeMenu).toHaveBeenCalledTimes(1)

    const contextEvent = fireEvent.contextMenu(trigger())
    expect(contextEvent).toBe(false) // default prevented
    expect(spies.openMenu).toHaveBeenCalledTimes(1) // did NOT open again
  })

  it('stays fully controlled: without openMenu the children own open state and right-click does not open', () => {
    const spies = createSpies()
    render(<StatefulMenu spies={spies} withoutOpenMenu />)
    fireEvent.contextMenu(trigger())
    expect(spies.openMenu).not.toHaveBeenCalled()
    expect(document.querySelector(POPUP_SELECTOR)).toBeNull()
  })

  it('disabled renders bare children with no trigger wrapper and never opens', () => {
    const spies = createSpies()
    render(<StatefulMenu spies={spies} disabled />)
    expect(document.querySelector(TRIGGER_SELECTOR)).toBeNull()
    fireEvent.contextMenu(screen.getByText('trigger'))
    expect(spies.openMenu).not.toHaveBeenCalled()
  })

  it('adaptToSheet is accepted but the sheet leg is gated: the popover presentation renders regardless (INFRA-3021 deferral)', () => {
    const spies = createSpies()
    render(<StatefulMenu spies={spies} initialOpen adaptToSheet />)
    expect(document.querySelector(POPUP_SELECTOR)).toBeTruthy()
  })
})

describe('ContextMenuCompat — openAt imperative handle', () => {
  it('opens at explicit coordinates through a point anchor and toggles closed when already open', () => {
    const spies = createSpies()
    const menuRef = createRef<ContextMenuCompatHandle>()
    render(<StatefulMenu spies={spies} triggerMode="primary" menuRef={menuRef} />)

    fireEvent.click(document.body) // no-op guard: nothing open yet

    act(() => menuRef.current?.openAt(120, 240))
    expect(spies.openMenu).toHaveBeenCalledTimes(1)
    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(positioner.getAttribute('data-explicit-anchor')).toBe('120,240')

    act(() => menuRef.current?.openAt(120, 240))
    expect(spies.closeMenu).toHaveBeenCalledTimes(1)
  })

  it('an anchored (trigger) open clears the previous explicit position', () => {
    const spies = createSpies()
    const menuRef = createRef<ContextMenuCompatHandle>()
    render(<StatefulMenu spies={spies} triggerMode="primary" menuRef={menuRef} />)

    act(() => menuRef.current?.openAt(64, 32))
    expect((document.querySelector(POSITIONER_SELECTOR) as HTMLElement).getAttribute('data-explicit-anchor')).toBe(
      '64,32',
    )
    act(() => menuRef.current?.openAt(64, 32)) // toggle closed

    fireEvent.mouseDown(trigger())
    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(positioner.getAttribute('data-explicit-anchor')).toBeNull()
  })

  it('openAt is inert while disabled', () => {
    const spies = createSpies()
    const menuRef = createRef<ContextMenuCompatHandle>()
    render(<StatefulMenu spies={spies} triggerMode="primary" menuRef={menuRef} disabled />)
    expect(menuRef.current).not.toBeNull()
    act(() => menuRef.current?.openAt(10, 10))
    expect(spies.openMenu).not.toHaveBeenCalled()
  })
})

describe('ContextMenuCompat — dismiss microbehavior', () => {
  it('secondary mode closes on outside MOUSEDOWN, not mouseup', () => {
    const spies = createSpies()
    render(<StatefulMenu spies={spies} initialOpen />)
    fireEvent.mouseUp(document.body)
    expect(spies.closeMenu).not.toHaveBeenCalled()
    fireEvent.mouseDown(document.body)
    expect(spies.closeMenu).toHaveBeenCalledTimes(1)
  })

  it('secondary mode opened by a real right-click closes on the FIRST outside mousedown (no stale suppression)', () => {
    const spies = createSpies()
    render(<StatefulMenu spies={spies} />)

    // Open via a genuine contextmenu on the trigger — the opening gesture's
    // mousedown lands inside triggerContainerRef and must not arm the
    // one-shot suppression meant for primary mode's trailing mouseup.
    fireEvent.contextMenu(trigger())
    expect(document.querySelector(POPUP_SELECTOR)).toBeTruthy()

    fireEvent.mouseDown(document.body)
    expect(spies.closeMenu).toHaveBeenCalledTimes(1)
  })

  it('primary mode closes on outside MOUSEUP, not mousedown', () => {
    const spies = createSpies()
    render(<StatefulMenu spies={spies} triggerMode="primary" initialOpen />)
    fireEvent.mouseDown(document.body)
    expect(spies.closeMenu).not.toHaveBeenCalled()
    fireEvent.mouseUp(document.body)
    expect(spies.closeMenu).toHaveBeenCalledTimes(1)
  })

  it('listens in CAPTURE phase: closes even when the outside target stops propagation (the in-modal case)', () => {
    const spies = createSpies()
    render(
      <div>
        <StatefulMenu spies={spies} initialOpen />
        <div data-testid="modal-overlay" onMouseDown={(e): void => e.stopPropagation()} />
      </div>,
    )
    fireEvent.mouseDown(screen.getByTestId('modal-overlay'))
    expect(spies.closeMenu).toHaveBeenCalledTimes(1)
  })

  it('ignores the trigger container and the menu content itself', () => {
    const spies = createSpies()
    render(<StatefulMenu spies={spies} initialOpen />)
    fireEvent.mouseDown(trigger())
    const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement
    fireEvent.mouseDown(popup)
    expect(spies.closeMenu).not.toHaveBeenCalled()
  })

  it('suppresses exactly one trailing mouseup after openAt (the right-click that opened via an ancestor)', () => {
    const spies = createSpies()
    const menuRef = createRef<ContextMenuCompatHandle>()
    render(<StatefulMenu spies={spies} triggerMode="primary" menuRef={menuRef} />)

    act(() => menuRef.current?.openAt(50, 60))
    // The right-click's own trailing mouseup lands outside: suppressed once.
    fireEvent.mouseUp(document.body)
    expect(spies.closeMenu).not.toHaveBeenCalled()
    // The next genuine outside mouseup closes.
    fireEvent.mouseUp(document.body)
    expect(spies.closeMenu).toHaveBeenCalledTimes(1)
  })

  it('one-shot suppression does not survive a close: openAt arm left unconsumed (trailing mouseup INSIDE the popup), Escape close, reopen — the FIRST outside mouseup still dismisses', () => {
    const spies = createSpies()
    const menuRef = createRef<ContextMenuCompatHandle>()
    render(<StatefulMenu spies={spies} triggerMode="primary" menuRef={menuRef} />)

    // openAt (primary) arms the one-shot suppression for the opener's trailing mouseup.
    act(() => menuRef.current?.openAt(50, 60))
    const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement
    // The trailing mouseup lands ON the popup (it opened under the pointer):
    // the outside listener ignores inside events, so the arm is never consumed.
    fireEvent.mouseUp(popup)
    expect(spies.closeMenu).not.toHaveBeenCalled()

    // Close via a non-outside path (Escape) — the stale arm must not survive.
    fireEvent.keyDown(popup, { key: 'Escape' })
    expect(spies.closeMenu).toHaveBeenCalledTimes(1)
    expect(document.querySelector(POPUP_SELECTOR)).toBeNull()

    // Reopen via the trigger (primary opens on mousedown; this path never arms).
    fireEvent.mouseDown(trigger())
    expect(spies.openMenu).toHaveBeenCalledTimes(2)
    expect(document.querySelector(POPUP_SELECTOR)).toBeTruthy()

    // ONE outside mouseup must close it — a stale arm would swallow this.
    fireEvent.mouseUp(document.body)
    expect(spies.closeMenu).toHaveBeenCalledTimes(2)
  })

  it('requests close on Escape (legacy Tamagui popover default)', () => {
    const spies = createSpies()
    render(<StatefulMenu spies={spies} initialOpen />)
    const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement
    fireEvent.keyDown(popup, { key: 'Escape' })
    expect(spies.closeMenu).toHaveBeenCalledTimes(1)
  })

  it('blocks page scroll outside the open menu (RemoveScroll stand-in, see exclusions ledger)', () => {
    const spies = createSpies()
    render(<StatefulMenu spies={spies} initialOpen />)
    const outsideWheel = fireEvent.wheel(document.body, { cancelable: true })
    expect(outsideWheel).toBe(false) // prevented
    const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement
    const insideWheel = fireEvent.wheel(popup, { cancelable: true })
    expect(insideWheel).toBe(true)
  })

  it('blockOutsideScroll: false disables the scroll lock entirely (the facade seam for the legacy isWebApp gate)', () => {
    const spies = createSpies()
    render(<StatefulMenu spies={spies} initialOpen blockOutsideScroll={false} />)
    expect(document.querySelector(POPUP_SELECTOR)).toBeTruthy() // menu is open
    const outsideWheel = fireEvent.wheel(document.body, { cancelable: true })
    expect(outsideWheel).toBe(true) // NOT prevented — legacy extension behavior
    const outsideTouchMove = fireEvent.touchMove(document.body, { cancelable: true })
    expect(outsideTouchMove).toBe(true) // NOT prevented
  })
})

describe('ContextMenuCompat — items and press semantics', () => {
  it('renders the item vocabulary: labels, divider before flagged items, destructive coloring, menuitem roles (a11y upgrade)', () => {
    const spies = createSpies()
    render(<StatefulMenu spies={spies} initialOpen />)
    expect(screen.getByText('First')).toBeTruthy()
    expect(screen.getByText('Danger')).toBeTruthy()
    expect(document.querySelectorAll('[data-slot="menu-separator-compat"]').length).toBe(1)
    // Base UI upgrade: real menu semantics (legacy rendered role="none").
    expect(document.querySelectorAll('[role="menuitem"]').length).toBe(4)
    const dangerLabel = screen.getByText('Danger')
    expect(dangerLabel.className).toContain('statusCritical')
  })

  it('item press invokes onPress, stops propagation to ancestors, and closes the menu', () => {
    const spies = createSpies()
    const items = defaultItems()
    const ancestorClick = vi.fn()
    render(
      <div onClick={ancestorClick}>
        <StatefulMenu spies={spies} items={items} initialOpen />
      </div>,
    )
    fireEvent.click(screen.getByText('First'))
    expect(items[0]?.onPress).toHaveBeenCalledTimes(1)
    expect(spies.closeMenu).toHaveBeenCalledTimes(1)
    expect(ancestorClick).not.toHaveBeenCalled()
  })

  it('disabled items do not fire onPress or close the menu', () => {
    const spies = createSpies()
    const items = defaultItems()
    render(<StatefulMenu spies={spies} items={items} initialOpen />)
    fireEvent.click(screen.getByText('Off'))
    expect(items[3]?.onPress).not.toHaveBeenCalled()
    expect(spies.closeMenu).not.toHaveBeenCalled()
  })

  it('closeDelay defers the close (not the press) by the given milliseconds', () => {
    vi.useFakeTimers()
    const spies = createSpies()
    const items = defaultItems([{ closeDelay: 150 }])
    render(<StatefulMenu spies={spies} items={items} initialOpen />)
    fireEvent.click(screen.getByText('First'))
    expect(items[0]?.onPress).toHaveBeenCalledTimes(1)
    expect(spies.closeMenu).not.toHaveBeenCalled()
    vi.advanceTimersByTime(150)
    expect(spies.closeMenu).toHaveBeenCalledTimes(1)
  })

  it('contentOverride replaces the default MenuContent entirely', () => {
    const spies = createSpies()
    render(<StatefulMenu spies={spies} initialOpen contentOverride={<div data-testid="override">custom</div>} />)
    expect(screen.getByTestId('override')).toBeTruthy()
    expect(screen.queryByText('First')).toBeNull()
  })
})

describe('ContextMenuCompat — telemetry adapter seam (analytics parity is host-injected)', () => {
  it('reports opened/closed transitions and tracked item clicks with the legacy payload shape', () => {
    const adapter: MenuTelemetryAdapter = {
      onMenuOpened: vi.fn(),
      onMenuClosed: vi.fn(),
      onMenuItemClicked: vi.fn(),
    }
    const spies = createSpies()
    render(
      <StatefulMenu
        spies={spies}
        elementName="test-element"
        sectionName="test-section"
        trackItemClicks
        telemetryAdapter={adapter}
      />,
    )
    fireEvent.contextMenu(trigger())
    expect(adapter.onMenuOpened).toHaveBeenCalledWith({ elementName: 'test-element', sectionName: 'test-section' })
    fireEvent.click(screen.getByText('Second'))
    expect(adapter.onMenuItemClicked).toHaveBeenCalledWith({
      elementName: 'test-element',
      sectionName: 'test-section',
      label: 'Second',
      index: 1,
    })
    expect(adapter.onMenuClosed).toHaveBeenCalledWith({ elementName: 'test-element', sectionName: 'test-section' })
  })
})

describe('ContextMenuCompat — in-modal overlay z-index re-homing (the regression trap)', () => {
  function renderInHost(hostZIndex: number): void {
    const spies = createSpies()
    render(
      <EffectiveOverlayZIndexContext.Provider value={hostZIndex}>
        <StatefulMenu spies={spies} initialOpen />
      </EffectiveOverlayZIndexContext.Provider>,
    )
  }

  it('stacks above a hosting modal at z-1060 (naive portals land at z≈1000, BEHIND the modal)', () => {
    renderInHost(OVERLAY_Z_INDEXES.modal)
    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(Number(positioner.style.zIndex)).toBeGreaterThan(OVERLAY_Z_INDEXES.modal)
    expect(Number(positioner.style.zIndex)).toBe(OVERLAY_Z_INDEXES.popover)
  })

  it('stacks one above an extension-style overlay host (100010 → 100011)', () => {
    renderInHost(OVERLAY_Z_INDEXES.overlay)
    const positioner = document.querySelector(POSITIONER_SELECTOR) as HTMLElement
    expect(Number(positioner.style.zIndex)).toBe(OVERLAY_Z_INDEXES.overlay + 1)
  })

  it('re-provides the bumped layer to the menu content', () => {
    function Probe(): JSX.Element {
      const value = useContext(EffectiveOverlayZIndexContext)
      return <div data-testid="menu-z-probe">{String(value)}</div>
    }
    const spies = createSpies()
    render(
      <EffectiveOverlayZIndexContext.Provider value={OVERLAY_Z_INDEXES.overlay}>
        <StatefulMenu spies={spies} initialOpen contentOverride={<Probe />} />
      </EffectiveOverlayZIndexContext.Provider>,
    )
    expect(screen.getByTestId('menu-z-probe').textContent).toBe(String(OVERLAY_Z_INDEXES.overlay + 1))
  })
})

describe('MenuContentCompat + DropdownMenuSheetItemCompat — standalone (outside a menu root)', () => {
  it('renders the card and items without a Base UI menu context (contentOverride/standalone consumers)', () => {
    const onPress = vi.fn()
    render(
      <MenuContentCompat
        items={[{ label: 'Solo', onPress }]}
        handleCloseMenu={vi.fn()}
        containerStyles={{ backgroundColor: 'transparent' }}
      />,
    )
    fireEvent.click(screen.getByText('Solo'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('standalone item mirrors the legacy press contract (stopPropagation + preventDefault + delayed close)', () => {
    vi.useFakeTimers()
    const onPress = vi.fn()
    const handleCloseMenu = vi.fn()
    const ancestorClick = vi.fn()
    render(
      <div onClick={ancestorClick}>
        <DropdownMenuSheetItemCompat
          label="Standalone"
          variant="small"
          closeDelay={50}
          onPress={onPress}
          handleCloseMenu={handleCloseMenu}
        />
      </div>,
    )
    fireEvent.click(screen.getByText('Standalone'))
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(ancestorClick).not.toHaveBeenCalled()
    expect(handleCloseMenu).not.toHaveBeenCalled()
    vi.advanceTimersByTime(50)
    expect(handleCloseMenu).toHaveBeenCalledTimes(1)
  })

  it('isSelected renders the checkmark column only when defined (undefined = no column)', () => {
    const { rerender } = render(
      <DropdownMenuSheetItemCompat label="Pick" variant="small" onPress={vi.fn()} isSelected />,
    )
    expect(document.querySelector('[data-slot="menu-item-check"]')).toBeTruthy()
    rerender(<DropdownMenuSheetItemCompat label="Pick" variant="small" onPress={vi.fn()} isSelected={false} />)
    expect(document.querySelector('[data-slot="menu-item-check"]')).toBeNull()
    expect(document.querySelector('[data-slot="menu-item-check-spacer"]')).toBeTruthy()
    rerender(<DropdownMenuSheetItemCompat label="Pick" variant="small" onPress={vi.fn()} />)
    expect(document.querySelector('[data-slot="menu-item-check"]')).toBeNull()
    expect(document.querySelector('[data-slot="menu-item-check-spacer"]')).toBeNull()
  })

  it('external-link action renders the trailing external-link glyph', () => {
    render(<DropdownMenuSheetItemCompat label="Docs" variant="small" actionType="external-link" onPress={vi.fn()} />)
    expect(document.querySelector('[data-slot="menu-item-external-link"]')).toBeTruthy()
  })
})

describe('menu-compat platform legs — export parity', () => {
  it('the native leg exports every runtime symbol the web leg exports (bundler-resolution parity)', async () => {
    const [nativeLeg, webLeg] = await Promise.all([
      import('../../../../mycelium/src/menu-compat/index.native'),
      import('../../../../mycelium/src/menu-compat/index.web'),
    ])
    expect(Object.keys(nativeLeg).sort()).toEqual(Object.keys(webLeg).sort())
    // Platform-neutral values are REAL on native (loud throws stay reserved
    // for the web-only components and className compilers).
    expect(nativeLeg.MENU_MIN_WIDTH).toBe(webLeg.MENU_MIN_WIDTH)
    expect(nativeLeg.MENU_MAX_WIDTH).toBe(webLeg.MENU_MAX_WIDTH)
    expect(nativeLeg.MENU_CONTENT_SHEET_CONTAINER_STYLES_COMPAT).toEqual(
      webLeg.MENU_CONTENT_SHEET_CONTAINER_STYLES_COMPAT,
    )
    expect(() => nativeLeg.ContextMenuCompat()).toThrow(/web-only/)
  })
})
