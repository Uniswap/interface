import { Menu } from '@base-ui/react/menu'
import { Popover } from '@base-ui/react/popover'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { KeyboardEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TouchableAreaCompat as TouchableArea } from './TouchableAreaCompat.web'

describe('TouchableAreaCompat (web) keyboard activation', () => {
  it('Enter presses on keydown and Space on keyup, once each', async () => {
    const onPress = vi.fn()
    const user = userEvent.setup()
    render(<TouchableArea onPress={onPress}>Press</TouchableArea>)
    const button = screen.getByRole('button', { name: 'Press' })

    await user.tab()
    expect(document.activeElement).toBe(button)
    await user.keyboard('{Enter}')
    expect(onPress).toHaveBeenCalledTimes(1)
    await user.keyboard(' ')
    expect(onPress).toHaveBeenCalledTimes(2)
  })

  it('prevents the Space keydown (no page scroll) and presses only on its keyup', () => {
    const onPress = vi.fn()
    render(<TouchableArea onPress={onPress}>Press</TouchableArea>)
    const button = screen.getByRole('button')

    // fireEvent returns false when a handler called preventDefault().
    expect(fireEvent.keyDown(button, { key: ' ' })).toBe(false)
    expect(onPress).not.toHaveBeenCalled()
    fireEvent.keyUp(button, { key: ' ' })
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('a disabled area ignores Enter and Space and leaves the tab order', () => {
    const onPress = vi.fn()
    render(
      <TouchableArea disabled onPress={onPress}>
        Press
      </TouchableArea>,
    )
    const button = screen.getByRole('button')

    expect(button.tabIndex).toBe(-1)
    expect(button.getAttribute('aria-disabled')).toBe('true')
    fireEvent.keyDown(button, { key: 'Enter' })
    fireEvent.keyDown(button, { key: ' ' })
    fireEvent.keyUp(button, { key: ' ' })
    expect(onPress).not.toHaveBeenCalled()
  })

  it('keys typed in a child input neither press the area nor lose the typed space', () => {
    const onPress = vi.fn()
    render(
      <TouchableArea onPress={onPress}>
        <input aria-label="Amount" />
      </TouchableArea>,
    )
    const input = screen.getByLabelText('Amount')

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(fireEvent.keyDown(input, { key: ' ' })).toBe(true)
    fireEvent.keyUp(input, { key: ' ' })
    expect(onPress).not.toHaveBeenCalled()
  })

  it("keeps forwarding the caller's onKeyDown and onKeyUp while disabled", () => {
    const onKeyDown = vi.fn()
    const onKeyUp = vi.fn()
    render(
      <TouchableArea disabled onKeyDown={onKeyDown} onKeyUp={onKeyUp}>
        Press
      </TouchableArea>,
    )
    const button = screen.getByRole('button')

    fireEvent.keyDown(button, { key: 'a' })
    fireEvent.keyUp(button, { key: 'a' })
    expect(onKeyDown).toHaveBeenCalledTimes(1)
    expect(onKeyUp).toHaveBeenCalledTimes(1)
  })

  it("runs the caller's onKeyDown first and lets it cancel the activation", () => {
    const onPress = vi.fn()
    const onKeyDown = vi.fn((event: KeyboardEvent<HTMLElement>) => event.preventDefault())
    render(
      <TouchableArea onPress={onPress} onKeyDown={onKeyDown}>
        Press
      </TouchableArea>,
    )

    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
    expect(onKeyDown).toHaveBeenCalledTimes(1)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('renders tag="button" as a native button with type="button" and no emulated activation', () => {
    const onPress = vi.fn()
    render(
      <TouchableArea tag="button" onPress={onPress}>
        Press
      </TouchableArea>,
    )
    const button = screen.getByRole('button')

    expect(button.tagName).toBe('BUTTON')
    expect(button.getAttribute('type')).toBe('button')
    // The browser's own activation handles Enter; jsdom's fireEvent does not synthesize it.
    expect(fireEvent.keyDown(button, { key: 'Enter' })).toBe(true)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('leaves Enter on a modifier-press link to the browser', () => {
    const onPress = vi.fn()
    render(
      <TouchableArea modifierPressHref="/tokens" onPress={onPress}>
        Go
      </TouchableArea>,
    )
    const link = screen.getByRole('link')

    expect(link.tagName).toBe('A')
    expect(fireEvent.keyDown(link, { key: 'Enter' })).toBe(true)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('makes a role="tab" area a tab stop', () => {
    render(
      <TouchableArea role="tab" onPress={vi.fn()}>
        Info
      </TouchableArea>,
    )
    expect(screen.getByRole('tab').tabIndex).toBe(0)
  })

  it('as a Base UI popover trigger, Enter and Space each open it once and press it once', async () => {
    const onOpenChange = vi.fn()
    const onPress = vi.fn()
    const user = userEvent.setup()
    render(
      <Popover.Root onOpenChange={onOpenChange}>
        <Popover.Trigger nativeButton={false} render={<TouchableArea onPress={onPress}>Open</TouchableArea>} />
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>Content</Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    )
    const trigger = screen.getByRole('button', { name: 'Open' })

    await user.tab()
    expect(document.activeElement).toBe(trigger)
    await user.keyboard('{Enter}')
    expect(onOpenChange.mock.calls.map((call) => call[0])).toEqual([true])
    expect(onPress).toHaveBeenCalledTimes(1)

    await user.keyboard('{Escape}')
    expect(document.activeElement).toBe(trigger)
    await user.keyboard(' ')
    expect(onOpenChange.mock.calls.map((call) => call[0])).toEqual([true, false, true])
    expect(onPress).toHaveBeenCalledTimes(2)
  })

  it('as a Base UI menu item, Enter and Space each press it once', async () => {
    const onPress = vi.fn()
    const user = userEvent.setup()
    render(
      <Menu.Root open>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item closeOnClick={false} render={<TouchableArea onPress={onPress}>Item</TouchableArea>} />
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    )
    const item = screen.getByRole('menuitem', { name: 'Item' })
    item.focus()

    await user.keyboard('{Enter}')
    expect(onPress).toHaveBeenCalledTimes(1)
    await user.keyboard(' ')
    expect(onPress).toHaveBeenCalledTimes(2)
  })
})
