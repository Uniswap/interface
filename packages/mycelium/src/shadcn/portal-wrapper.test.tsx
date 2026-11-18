/**
 * The shadcn floating recipes inside a host modal's portal target (the AdaptiveWebModal content
 * column, a gapped flex box). Base UI mounts a nested portal inside its parent overlay's portal,
 * and the ui Popover's portal there is display:contents, so a boxed portal wrapper becomes a new
 * flex item and the modal grows by one gap (and re-centers) whenever the overlay opens.
 */
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { cleanup, render, screen } from '@testing-library/react'
import type { JSX, ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

// Base UI's Positioner runs floating-ui autoUpdate, which observes resizes.
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  },
)

afterEach(cleanup)

const NESTED_OVERLAYS: { name: string; render: (open: boolean) => JSX.Element }[] = [
  {
    name: 'DropdownMenuContent',
    render: (open) => (
      <DropdownMenu open={open}>
        <DropdownMenuTrigger>menu</DropdownMenuTrigger>
        <DropdownMenuContent data-testid="nested-popup">
          <DropdownMenuItem>item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
  {
    name: 'SelectContent',
    render: (open) => (
      <Select open={open} defaultValue="a">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent data-testid="nested-popup">
          <SelectItem value="a">a</SelectItem>
        </SelectContent>
      </Select>
    ),
  },
  {
    name: 'PopoverContent',
    render: (open) => (
      <Popover open={open}>
        <PopoverTrigger>popover</PopoverTrigger>
        <PopoverContent data-testid="nested-popup">content</PopoverContent>
      </Popover>
    ),
  },
]

describe('shadcn floating recipes — portal wrapper inside a host modal', () => {
  it.each(NESTED_OVERLAYS)('$name nested in a hosted popover adds no in-flow box to the host column', (overlay) => {
    withHost((host) => {
      const view = render(<HostedPopover host={host}>{overlay.render(false)}</HostedPopover>)
      const closedFlow = inFlowChildren(host)

      view.rerender(<HostedPopover host={host}>{overlay.render(true)}</HostedPopover>)
      const portalWrapper = getPortalWrapper()

      expect(host.contains(portalWrapper)).toBe(true)
      expect(portalWrapper.style.display).toBe('contents')
      expect(inFlowChildren(host)).toEqual(closedFlow)
    })
  })

  it('PopoverContent portaled straight into the host adds no in-flow box', () => {
    withHost((host) => {
      const content = (open: boolean): JSX.Element => (
        <Popover open={open}>
          <PopoverTrigger>popover</PopoverTrigger>
          <PopoverContent data-testid="nested-popup" portalContainer={host} positionerProps={FIXED_POSITIONER} />
        </Popover>
      )
      const view = render(content(false))
      const closedFlow = inFlowChildren(host)

      view.rerender(content(true))

      expect(getPortalWrapper().parentElement).toBe(host)
      expect(inFlowChildren(host)).toEqual(closedFlow)
    })
  })
})

const FIXED_POSITIONER = { style: { position: 'fixed' } } as const

/** The ui Popover's shape: a Base UI popover portaled display:contents into the host modal's column. */
function HostedPopover({ host, children }: { host: HTMLElement; children: ReactNode }): JSX.Element {
  return (
    <PopoverPrimitive.Root open>
      <PopoverPrimitive.Trigger>settings</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal container={host} style={{ display: 'contents' }}>
        <PopoverPrimitive.Positioner style={{ position: 'fixed' }}>
          <PopoverPrimitive.Popup>{children}</PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

function withHost(run: (host: HTMLElement) => void): void {
  const host = document.createElement('div')
  host.style.display = 'flex'
  host.style.flexDirection = 'column'
  host.style.gap = '12px'
  document.body.appendChild(host)
  try {
    run(host)
  } finally {
    cleanup()
    host.remove()
  }
}

/** The nested overlay's portal <div>: the parent of its positioner. */
function getPortalWrapper(): HTMLElement {
  const positioner = screen.getByTestId('nested-popup').parentElement
  const wrapper = positioner?.parentElement
  if (!wrapper) {
    throw new Error('nested overlay is not portaled')
  }
  return wrapper
}

/** The host's flex items: children with display:contents are see-through, out-of-flow children are skipped. */
function inFlowChildren(container: HTMLElement): HTMLElement[] {
  return Array.from(container.children).flatMap((child) => {
    const element = child as HTMLElement
    if (element.style.display === 'contents') {
      return inFlowChildren(element)
    }
    const position = element.style.position
    return position === 'absolute' || position === 'fixed' ? [] : [element]
  })
}
