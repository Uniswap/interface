import { Menu } from '@base-ui/react/menu'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TriggerButtonCompat } from './TriggerButtonCompat'

describe('TriggerButtonCompat keyboard activation', () => {
  it('is a native button that Enter and Space each press once', async () => {
    const onPress = vi.fn()
    const user = userEvent.setup()
    render(
      <TriggerButtonCompat isExpanded={false} onPress={onPress}>
        Network
      </TriggerButtonCompat>,
    )
    const button = screen.getByRole('button', { name: 'Network' })

    expect(button.tagName).toBe('BUTTON')
    expect(button.getAttribute('type')).toBe('button')
    await user.tab()
    expect(document.activeElement).toBe(button)
    await user.keyboard('{Enter}')
    expect(onPress).toHaveBeenCalledTimes(1)
    await user.keyboard(' ')
    expect(onPress).toHaveBeenCalledTimes(2)
  })

  it('a disabled trigger is a disabled button that ignores keys and clicks', () => {
    const onPress = vi.fn()
    render(
      <TriggerButtonCompat isExpanded={false} disabled onPress={onPress}>
        Network
      </TriggerButtonCompat>,
    )
    const button = screen.getByRole('button')

    expect((button as HTMLButtonElement).disabled).toBe(true)
    fireEvent.keyDown(button, { key: 'Enter' })
    fireEvent.keyUp(button, { key: ' ' })
    fireEvent.click(button)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('as a Base UI menu trigger, Enter opens the menu once and presses once', async () => {
    const onOpenChange = vi.fn()
    const onPress = vi.fn()
    const user = userEvent.setup()
    render(
      <Menu.Root onOpenChange={onOpenChange}>
        <Menu.Trigger
          render={
            <TriggerButtonCompat isExpanded={false} onPress={onPress}>
              Sort
            </TriggerButtonCompat>
          }
        />
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item>Volume</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    )
    const trigger = screen.getByRole('button', { name: 'Sort' })

    await user.tab()
    expect(document.activeElement).toBe(trigger)
    await user.keyboard('{Enter}')
    expect(onOpenChange.mock.calls.map((call) => call[0])).toEqual([true])
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menuitem', { name: 'Volume' })).not.toBeNull()
  })
})
