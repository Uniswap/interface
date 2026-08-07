// @vitest-environment jsdom
/**
 * Behavior contract for the shadcn Command recipe (INFRA-3021 shadcn set) —
 * the recipe has no legacy counterpart, so this pins ITS OWN contract: the
 * word-prefix filter default, group auto-hiding, empty state, the WAI-ARIA
 * combobox/listbox keyboard semantics (clamp, reset-on-query, Enter), and
 * the render-prop composition the compat option rows use.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { JSX } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../../mycelium/src/shadcn/command'

afterEach(cleanup)

function Harness({ onSelect = (): void => undefined }: { onSelect?: (value: string) => void }): JSX.Element {
  return (
    <Command>
      <CommandInput placeholder="Search chains" />
      <CommandEmpty>Nothing found</CommandEmpty>
      <CommandList>
        <CommandGroup heading="Your balances">
          <CommandItem value="Ethereum" keywords={['mainnet']} onSelect={() => onSelect('ethereum')}>
            Ethereum
          </CommandItem>
          <CommandItem value="OP Mainnet" keywords={['optimism']} onSelect={() => onSelect('optimism')}>
            OP Mainnet
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Other networks">
          <CommandItem value="World Chain" keywords={['worldchain']} onSelect={() => onSelect('worldchain')}>
            World Chain
          </CommandItem>
          <CommandItem value="Disabled Net" disabled onSelect={() => onSelect('disabled')}>
            Disabled Net
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

function input(): HTMLInputElement {
  return document.querySelector('[data-slot="command-input"]') as HTMLInputElement
}

function visibleOptionTexts(): string[] {
  return [...document.querySelectorAll('[role="option"]')].map((el) => el.textContent)
}

describe('Command — filtering + groups + empty state', () => {
  it('renders all items with an empty query and exposes combobox/listbox roles', () => {
    render(<Harness />)
    expect(visibleOptionTexts()).toEqual(['Ethereum', 'OP Mainnet', 'World Chain', 'Disabled Net'])
    expect(input().getAttribute('role')).toBe('combobox')
    const listbox = screen.getByRole('listbox')
    expect(input().getAttribute('aria-controls')).toBe(listbox.id)
    expect(screen.queryByText('Nothing found')).toBeNull()
  })

  it('filters by word prefix over value AND keywords; emptied groups unmount their headings', () => {
    render(<Harness />)
    fireEvent.change(input(), { target: { value: 'optim' } })
    expect(visibleOptionTexts()).toEqual(['OP Mainnet'])
    const headings = [...document.querySelectorAll('[data-slot="command-group-heading"]')].map((h) => h.textContent)
    expect(headings).toEqual(['Your balances'])
    // Mid-word substrings don't match (prefix semantics).
    fireEvent.change(input(), { target: { value: 'thereum' } })
    expect(visibleOptionTexts()).toEqual([])
    expect(screen.getByText('Nothing found')).toBeTruthy()
  })

  it('re-shows filtered items when the query relaxes (hidden groups keep their children mounted)', () => {
    render(<Harness />)
    fireEvent.change(input(), { target: { value: 'world' } })
    expect(visibleOptionTexts()).toEqual(['World Chain'])
    fireEvent.change(input(), { target: { value: '' } })
    expect(visibleOptionTexts()).toEqual(['Ethereum', 'OP Mainnet', 'World Chain', 'Disabled Net'])
    expect(screen.queryByText('Nothing found')).toBeNull()
  })

  it('supports a custom filter and a controlled query', () => {
    const onQueryChange = vi.fn()
    function Controlled(): JSX.Element {
      return (
        <Command query="zz" filter={(item, query) => item.value.endsWith(query)} onQueryChange={onQueryChange}>
          <CommandInput />
          <CommandList>
            <CommandItem value="fizz">fizz</CommandItem>
            <CommandItem value="buzz">buzz</CommandItem>
            <CommandItem value="fizzle">fizzle</CommandItem>
          </CommandList>
        </Command>
      )
    }
    render(<Controlled />)
    expect(visibleOptionTexts()).toEqual(['fizz', 'buzz'])
    expect(input().value).toBe('zz')
    fireEvent.change(input(), { target: { value: 'zzz' } })
    expect(onQueryChange).toHaveBeenCalledWith('zzz')
    // Controlled: the rendered query stays the prop value.
    expect(input().value).toBe('zz')
  })
})

describe('Command — keyboard navigation (combobox/listbox pattern)', () => {
  it('ArrowDown/Up move the active option with clamp (no wrap); Home/End jump; skips disabled items', () => {
    render(<Harness />)
    const options = screen.getAllByRole('option')
    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    expect(input().getAttribute('aria-activedescendant')).toBe(options[0]?.id)
    fireEvent.keyDown(input(), { key: 'ArrowUp' })
    expect(input().getAttribute('aria-activedescendant')).toBe(options[0]?.id)
    fireEvent.keyDown(input(), { key: 'End' })
    // Disabled Net is excluded from navigation — End lands on World Chain.
    expect(input().getAttribute('aria-activedescendant')).toBe(options[2]?.id)
    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    expect(input().getAttribute('aria-activedescendant')).toBe(options[2]?.id)
    fireEvent.keyDown(input(), { key: 'Home' })
    expect(input().getAttribute('aria-activedescendant')).toBe(options[0]?.id)
  })

  it('Enter selects the active option; without an active option it is a no-op; query change resets the active option', () => {
    const onSelect = vi.fn()
    render(<Harness onSelect={onSelect} />)
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('ethereum')
    fireEvent.change(input(), { target: { value: 'world' } })
    expect(input().getAttribute('aria-activedescendant')).toBeNull()
    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('worldchain')
  })

  it('click selects an item; disabled items do not select', () => {
    const onSelect = vi.fn()
    render(<Harness onSelect={onSelect} />)
    fireEvent.click(screen.getByText('OP Mainnet'))
    expect(onSelect).toHaveBeenCalledWith('optimism')
    fireEvent.click(screen.getByText('Disabled Net'))
    expect(onSelect).not.toHaveBeenCalledWith('disabled')
  })
})

describe('Command — render-prop composition (the compat option-row path)', () => {
  it('composes option semantics (id/role/aria-selected/data-active/click) onto a custom element', () => {
    const onSelect = vi.fn()
    render(
      <Command>
        <CommandInput />
        <CommandList>
          <CommandItem
            value="Ethereum"
            selected
            activeClassName="bg-surface2"
            render={<button type="button" data-testid="custom-row" className="row-base" />}
            onSelect={onSelect}
          />
        </CommandList>
      </Command>,
    )
    const row = screen.getByTestId('custom-row')
    expect(row.getAttribute('role')).toBe('option')
    expect(row.getAttribute('aria-selected')).toBe('true')
    expect(row.id).not.toBe('')
    expect(row.className).toBe('row-base')
    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    expect(screen.getByTestId('custom-row').className).toContain('bg-surface2')
    expect(input().getAttribute('aria-activedescendant')).toBe(row.id)
    fireEvent.click(screen.getByTestId('custom-row'))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it("render branch COMPOSES the element's own onClick and ref instead of replacing them", () => {
    const elementOnClick = vi.fn()
    const elementRef = vi.fn()
    const onSelect = vi.fn()
    render(
      <Command>
        <CommandInput />
        <CommandList>
          <CommandItem
            value="Rendered"
            onSelect={onSelect}
            render={<button type="button" data-testid="composed-row" onClick={elementOnClick} ref={elementRef} />}
          />
        </CommandList>
      </Command>,
    )
    // The element's own ref sees the DOM node (alongside the internal registration ref).
    expect(elementRef).toHaveBeenCalledWith(screen.getByTestId('composed-row'))
    fireEvent.click(screen.getByTestId('composed-row'))
    expect(elementOnClick).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('keyboard navigation scrolls the active row into view (block: nearest)', () => {
    render(<Harness />)
    const options = [...document.querySelectorAll('[role="option"]')]
    const spies = options.map((el) => {
      const spy = vi.fn()
      ;(el as HTMLElement).scrollIntoView = spy
      return spy
    })
    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    expect(spies[0]).toHaveBeenCalledWith({ block: 'nearest' })
    // End jumps to the last NAVIGABLE row (disabled rows are not registered).
    fireEvent.keyDown(input(), { key: 'End' })
    expect(spies[2]).toHaveBeenCalledWith({ block: 'nearest' })
  })

  it('CommandItem className lands on BOTH branches — default and render (no silent divergence)', () => {
    render(
      <Command>
        <CommandInput />
        <CommandList>
          <CommandItem value="Default" className="extra-class">
            Default
          </CommandItem>
          <CommandItem
            value="Rendered"
            className="extra-class"
            render={<button type="button" data-testid="rendered-row" className="row-base" />}
          />
        </CommandList>
      </Command>,
    )
    expect(screen.getByText('Default').className).toContain('extra-class')
    expect(screen.getByTestId('rendered-row').className).toBe('row-base extra-class')
  })

  it('a controlled query change resets the active option — no dangling aria-activedescendant', () => {
    function ControlledHarness({ query }: { query: string }): JSX.Element {
      return (
        <Command query={query}>
          <CommandInput />
          <CommandList>
            <CommandItem value="Ethereum">Ethereum</CommandItem>
            <CommandItem value="OP Mainnet">OP Mainnet</CommandItem>
          </CommandList>
        </Command>
      )
    }
    const { rerender } = render(<ControlledHarness query="" />)
    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    expect(input().getAttribute('aria-activedescendant')).not.toBeNull()
    // The host sets the query prop directly (bypassing setQuery) and the
    // previously active row is filtered out — the pointer must clear.
    rerender(<ControlledHarness query="op" />)
    expect(visibleOptionTexts()).toEqual(['OP Mainnet'])
    expect(input().getAttribute('aria-activedescendant')).toBeNull()
  })

  it('data-slot and aria overrides pass through recipe parts (props spread last)', () => {
    render(
      <Command>
        <CommandInput data-slot="my-input" aria-label="Search" />
        <CommandList data-slot="my-list" />
      </Command>,
    )
    expect(document.querySelector('[data-slot="my-input"]')).toBeTruthy()
    expect(document.querySelector('[data-slot="my-list"]')).toBeTruthy()
  })
})
