// @vitest-environment jsdom
/**
 * Behavior contract for the shadcn Popover / DropdownMenu / Select recipes
 * (INFRA-3021 shadcn set): controlled open state, the composable anatomy
 * mounting the Base UI parts, data-slot overridability (props spread last),
 * and the positionerProps extension point the compat adapters ride.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { JSX } from 'react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
// Relative cross-package imports: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../mycelium/src/shadcn/dropdown-menu'
// nx-ignore-next-line
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '../../../mycelium/src/shadcn/popover'
// nx-ignore-next-line
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../mycelium/src/shadcn/select'

afterEach(cleanup)

describe('Popover recipe', () => {
  it('opens on trigger press (uncontrolled) and mounts the positioner/content anatomy', () => {
    render(
      <Popover>
        <PopoverTrigger nativeButton={false} render={<button type="button">open</button>} />
        <PopoverContent data-testid="content">hello</PopoverContent>
      </Popover>,
    )
    expect(screen.queryByTestId('content')).toBeNull()
    fireEvent.click(screen.getByText('open'))
    expect(screen.getByTestId('content')).toBeTruthy()
    expect(document.querySelector('[data-slot="popover-positioner"]')).toBeTruthy()
    expect(document.querySelector('[data-slot="popover-content"]')).toBeTruthy()
  })

  it('stays controlled: close requests route through onOpenChange; positionerProps + data-slot overrides land', () => {
    const onOpenChange = vi.fn()
    render(
      <Popover open onOpenChange={onOpenChange}>
        <PopoverTrigger nativeButton={false} render={<button type="button">open</button>} />
        <PopoverContent
          data-slot="my-popup"
          positionerProps={{ 'data-slot': 'my-positioner', style: { zIndex: 1234 } }}
        >
          <div data-testid="content">hello</div>
        </PopoverContent>
      </Popover>,
    )
    const positioner = document.querySelector('[data-slot="my-positioner"]') as HTMLElement
    expect(positioner).toBeTruthy()
    expect(positioner.style.zIndex).toBe('1234')
    expect(document.querySelector('[data-slot="my-popup"]')).toBeTruthy()
    fireEvent.keyDown(screen.getByTestId('content'), { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false)
    // Fully controlled — still mounted until the owner flips open.
    expect(screen.getByTestId('content')).toBeTruthy()
  })

  it('PopoverAnchor wires the Positioner anchor: the popup positions off the anchor rect, not the trigger', async () => {
    // jsdom has no layout — every rect is zeros — so give the anchor a
    // distinctive rect via its ref (which also exercises the ref-merge path)
    // and assert the positioner lands on anchor-derived coordinates.
    const anchorRect = {
      x: 100,
      y: 50,
      width: 40,
      height: 20,
      top: 50,
      left: 100,
      right: 140,
      bottom: 70,
      toJSON: (): Record<string, never> => ({}),
    } as DOMRect
    function Harness(): JSX.Element {
      const [open, setOpen] = useState(false)
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger nativeButton={false} render={<button type="button">open</button>} />
          <PopoverAnchor
            data-testid="anchor"
            ref={(element) => {
              if (element) {
                element.getBoundingClientRect = (): DOMRect => anchorRect
              }
            }}
          />
          {/* collisionAvoidance off: jsdom's zero-size viewport otherwise flips/shifts the popup */}
          <PopoverContent collisionAvoidance={{ side: 'none', align: 'none' }}>hello</PopoverContent>
        </Popover>
      )
    }
    render(<Harness />)
    expect(screen.getByTestId('anchor').getAttribute('data-slot')).toBe('popover-anchor')
    fireEvent.click(screen.getByText('open'))
    const positioner = document.querySelector('[data-slot="popover-positioner"]') as HTMLElement
    expect(positioner).toBeTruthy()
    await waitFor(() => {
      // side=bottom sideOffset=8 → y = anchor.bottom + 8 = 78; align=center
      // over a zero-width popup → x = anchor center = 120. A trigger-anchored
      // popup would sit at the trigger's zero rect (0, 8) instead.
      expect(positioner.style.transform).toContain('120px')
      expect(positioner.style.transform).toContain('78px')
    })
  })
})

describe('DropdownMenu recipe', () => {
  function Menu(): JSX.Element {
    const [checked, setChecked] = useState(false)
    return (
      <DropdownMenu>
        <DropdownMenuTrigger nativeButton={false} render={<button type="button">menu</button>} />
        <DropdownMenuContent>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => undefined}>Copy</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked={checked} onCheckedChange={setChecked} closeOnClick={false}>
            Notify
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  it('mounts menu semantics: menuitem roles, checkbox item toggles without closing, destructive variant attr', () => {
    render(<Menu />)
    fireEvent.click(screen.getByText('menu'))
    expect(screen.getAllByRole('menuitem').length).toBeGreaterThanOrEqual(2)
    const destructive = screen.getByText('Delete')
    expect(destructive.getAttribute('data-variant')).toBe('destructive')
    const checkbox = screen.getByRole('menuitemcheckbox')
    expect(checkbox.getAttribute('aria-checked')).toBe('false')
    fireEvent.click(checkbox)
    // closeOnClick=false keeps the menu open and the state flips.
    expect(screen.getByRole('menuitemcheckbox').getAttribute('aria-checked')).toBe('true')
  })

  it('emits data-inset only when inset is true — the Tailwind data-inset: variant is presence-based', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger nativeButton={false} render={<button type="button">menu</button>} />
        <DropdownMenuContent>
          <DropdownMenuLabel inset>Inset label</DropdownMenuLabel>
          <DropdownMenuItem inset>Inset item</DropdownMenuItem>
          <DropdownMenuItem inset={false}>Explicitly not inset</DropdownMenuItem>
          <DropdownMenuItem>Default item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    expect(screen.getByText('Inset label').hasAttribute('data-inset')).toBe(true)
    expect(screen.getByText('Inset item').hasAttribute('data-inset')).toBe(true)
    // inset={false} must NOT render data-inset="false" — [data-inset] matches
    // regardless of value, so the attribute itself has to be absent.
    expect(screen.getByText('Explicitly not inset').hasAttribute('data-inset')).toBe(false)
    expect(screen.getByText('Default item').hasAttribute('data-inset')).toBe(false)
  })
})

describe('Select recipe', () => {
  it('mounts the trigger/value anatomy and opens to option roles', () => {
    render(
      <Select defaultValue="eth">
        <SelectTrigger data-testid="select-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="eth">Ethereum</SelectItem>
          <SelectItem value="uni">Unichain</SelectItem>
        </SelectContent>
      </Select>,
    )
    const trigger = screen.getByTestId('select-trigger')
    expect(trigger.getAttribute('data-slot')).toBe('select-trigger')
    fireEvent.click(trigger)
    const options = screen.getAllByRole('option')
    expect(options.length).toBe(2)
    expect(document.querySelector('[data-slot="select-content"]')).toBeTruthy()
  })
})
