// @vitest-environment jsdom
/**
 * Behavior contract for the filter-select compat (INFRA-3021 dropdown set):
 * the legacy web `DropdownSelector`/`Dropdown` runtime semantics on a Base UI
 * Menu engine — fully controlled isOpen/toggleOpen, option rendering with
 * the selected checkmark, testID conventions, matchTriggerWidth — plus the
 * multi-select checkbox shape (Base UI Menu.CheckboxItem + Select all/Clear
 * header) and the free a11y upgrade (menuitem roles).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState, type ComponentProps, type JSX } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import {
  FILTER_SELECT_MATCH_TRIGGER_WIDTH_CLASS_NAME,
  FilterSelectCompat,
  FilterSelectMultiCompat,
} from '../../../../mycelium/src/filter-select-compat'
import { FILTER_SELECT_PARITY_EXCLUSIONS } from './exclusions'

afterEach(cleanup)

const OPTIONS = {
  all: { label: 'All transactions' },
  swaps: { label: 'Swaps' },
  transfers: { label: 'Transfers' },
}

function ButtonIcon(): JSX.Element {
  return <i data-testid="button-icon" />
}

type FilterSelectProps = Partial<ComponentProps<typeof FilterSelectCompat>>

function ControlledFilterSelect({
  onSelect = () => undefined,
  toggleSpy,
  defaultOpen = false,
  ...props
}: FilterSelectProps & { toggleSpy?: (open: boolean) => void; defaultOpen?: boolean }): JSX.Element {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <FilterSelectCompat
      options={OPTIONS}
      selectedValue="swaps"
      ButtonIcon={ButtonIcon}
      dataTestId="filter-select-trigger"
      isOpen={isOpen}
      toggleOpen={(open: boolean) => {
        toggleSpy?.(open)
        setIsOpen(open)
      }}
      onSelect={onSelect}
      {...props}
    />
  )
}

describe('FilterSelectCompat — controlled open + selection (DropdownSelector parity)', () => {
  it('shows the selected option label + ButtonIcon on the trigger and toggles through toggleOpen', () => {
    const toggleSpy = vi.fn()
    render(<ControlledFilterSelect toggleSpy={toggleSpy} />)
    const trigger = screen.getByTestId('filter-select-trigger')
    expect(trigger.textContent).toContain('Swaps')
    expect(screen.getByTestId('button-icon')).toBeTruthy()
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
    fireEvent.click(trigger)
    expect(toggleSpy).toHaveBeenCalledWith(true)
    expect(screen.getAllByRole('menuitem')).toHaveLength(3)
  })

  it('selecting an option calls onSelect with the value and closes via toggleOpen(false)', () => {
    const onSelect = vi.fn()
    const toggleSpy = vi.fn()
    render(<ControlledFilterSelect defaultOpen onSelect={onSelect} toggleSpy={toggleSpy} />)
    fireEvent.click(screen.getByText('Transfers'))
    expect(onSelect).toHaveBeenCalledWith('transfers')
    expect(toggleSpy).toHaveBeenCalledWith(false)
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
  })

  it('marks the selected option with the check glyph', () => {
    render(<ControlledFilterSelect defaultOpen />)
    // "Swaps" also appears on the trigger (the selected label) — scope to menu items.
    const items = screen.getAllByRole('menuitem')
    const selected = items.find((item) => item.textContent.includes('Swaps')) as HTMLElement
    expect(selected.querySelector('[data-slot="filter-select-check"]')).toBeTruthy()
    const unselected = items.find((item) => item.textContent.includes('Transfers')) as HTMLElement
    expect(unselected.querySelector('[data-slot="filter-select-check"]')).toBeNull()
  })

  it('applies the testID conventions (optionTestIdPrefix, dropdownTestId)', () => {
    render(<ControlledFilterSelect defaultOpen optionTestIdPrefix="activity-filter-" dropdownTestId="activity-menu" />)
    expect(screen.getByTestId('activity-filter-swaps')).toBeTruthy()
    expect(screen.getByTestId('activity-menu')).toBeTruthy()
  })

  it('Escape requests close through toggleOpen(false) (stays controlled)', () => {
    const toggleSpy = vi.fn()
    render(<ControlledFilterSelect defaultOpen toggleSpy={toggleSpy} />)
    fireEvent.keyDown(document.querySelector('[data-slot="filter-select-popup"]') as HTMLElement, { key: 'Escape' })
    expect(toggleSpy).toHaveBeenCalledWith(false)
  })

  it('matchTriggerWidth sizes the popup from the positioner anchor variable (no JS measuring)', () => {
    render(<ControlledFilterSelect defaultOpen matchTriggerWidth />)
    expect(FILTER_SELECT_MATCH_TRIGGER_WIDTH_CLASS_NAME).toContain('--anchor-width')
    const popup = document.querySelector('[data-slot="filter-select-popup"]') as HTMLElement
    expect(popup.className).toContain(FILTER_SELECT_MATCH_TRIGGER_WIDTH_CLASS_NAME)
  })

  it('accepts the gated/inert legacy plumbing without changing presentation (adaptToSheet, positionFixed, tooltipText)', () => {
    render(
      <ControlledFilterSelect
        defaultOpen
        adaptToSheet
        positionFixed
        forceFlipUp
        alignRight
        tooltipText="Filter activity"
      />,
    )
    // Still the menu presentation (sheet leg gated), tooltip as title stand-in.
    expect(screen.getAllByRole('menuitem')).toHaveLength(3)
    expect(screen.getByTestId('filter-select-trigger').getAttribute('title')).toBe('Filter activity')
  })
})

describe('FilterSelectMultiCompat — the multi-select checkbox shape (D′)', () => {
  function renderMulti({
    onToggle = vi.fn(),
    onSelectAll,
    onClear,
  }: {
    onToggle?: (value: string, checked: boolean) => void
    onSelectAll?: () => void
    onClear?: () => void
  }): ReturnType<typeof render> {
    function Host(): JSX.Element {
      const [isOpen, setIsOpen] = useState(true)
      return (
        <FilterSelectMultiCompat
          label="Protocols"
          isOpen={isOpen}
          toggleOpen={setIsOpen}
          items={[
            { value: 'v2', label: 'V2', checked: true },
            { value: 'v3', label: 'V3', checked: true },
            { value: 'v4', label: 'V4', checked: false },
          ]}
          onToggle={onToggle}
          onSelectAll={onSelectAll}
          onClear={onClear}
        />
      )
    }
    return render(<Host />)
  }

  it('renders menuitemcheckbox rows with aria-checked and toggles WITHOUT closing the menu', () => {
    const onToggle = vi.fn()
    renderMulti({ onToggle })
    const boxes = screen.getAllByRole('menuitemcheckbox')
    expect(boxes).toHaveLength(3)
    expect(boxes[0]?.getAttribute('aria-checked')).toBe('true')
    expect(boxes[2]?.getAttribute('aria-checked')).toBe('false')
    fireEvent.click(screen.getByText('V4'))
    expect(onToggle).toHaveBeenCalledWith('v4', true)
    // closeOnClick=false: the menu stays open for further toggling.
    expect(screen.getAllByRole('menuitemcheckbox')).toHaveLength(3)
    fireEvent.click(screen.getByText('V2'))
    expect(onToggle).toHaveBeenCalledWith('v2', false)
  })

  it('renders the Select all / Clear header only when handlers are provided', () => {
    renderMulti({ onSelectAll: vi.fn(), onClear: vi.fn() })
    expect(screen.getByText('Select all')).toBeTruthy()
    expect(screen.getByText('Clear')).toBeTruthy()
    cleanup()
    renderMulti({})
    expect(screen.queryByText('Select all')).toBeNull()
  })
})

describe('filter-select-compat platform legs — export parity', () => {
  it('the native leg exports every runtime symbol the web leg exports (bundler-resolution parity)', async () => {
    const [nativeLeg, webLeg] = await Promise.all([
      import('../../../../mycelium/src/filter-select-compat/index.native'),
      import('../../../../mycelium/src/filter-select-compat/index.web'),
    ])
    expect(Object.keys(nativeLeg).sort()).toEqual(Object.keys(webLeg).sort())
    expect(() => (nativeLeg.FilterSelectCompat as () => never)()).toThrow(/web-only/)
  })
})

describe('filter-select exclusions ledger', () => {
  it('stays non-empty and documented (no silent deltas)', () => {
    expect(FILTER_SELECT_PARITY_EXCLUSIONS.length).toBeGreaterThan(0)
    for (const exclusion of FILTER_SELECT_PARITY_EXCLUSIONS) {
      expect(exclusion.reason.length).toBeGreaterThan(20)
      expect(exclusion.standIn.length).toBeGreaterThan(20)
    }
  })

  it('flags the gated sheet deferral prominently', () => {
    expect(FILTER_SELECT_PARITY_EXCLUSIONS.some((e) => e.area.includes('GATED DEFERRAL'))).toBe(true)
  })
})
