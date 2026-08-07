// @vitest-environment jsdom
/**
 * Behavior contract for the option-list compat (INFRA-3021 dropdown set):
 * the legacy NetworkFilterV2 dropdown-content semantics the CSS matrices
 * cannot prove — word-prefix search over sections, clear-on-close,
 * autoFocus-unless-sheet, the empty state, slot placement on the row — plus
 * the intentional a11y upgrade (WAI-ARIA combobox/listbox keyboard
 * navigation, which the legacy rows lack entirely; see the exclusions
 * ledger).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import {
  OptionRowCompat,
  SearchableOptionListCompat,
  SelectAllClearHeaderCompat,
} from '../../../../mycelium/src/option-list-compat'
// nx-ignore-next-line
import type { OptionListSectionCompat } from '../../../../mycelium/src/option-list-compat/types'
import { OPTION_LIST_PARITY_EXCLUSIONS } from './exclusions'

afterEach(cleanup)

const INPUT_SELECTOR = '[data-slot="option-list-search-input"]'
const ROW_SELECTOR = '[data-slot="option-row-compat"]'
const HEADER_SELECTOR = '[data-slot="option-list-section-header"]'

function networkSections({
  onSelect = (): void => undefined,
}: { onSelect?: (id: string) => void } = {}): OptionListSectionCompat[] {
  const item = (id: string, label: string, keywords: string[] = []): OptionListSectionCompat['items'][number] => ({
    id,
    label,
    keywords,
    onSelect: () => onSelect(id),
  })
  return [
    { key: 'top', items: [item('all', 'All networks')] },
    {
      key: 'withBalances',
      title: 'Your balances',
      items: [item('1', 'Ethereum', ['ethereum']), item('10', 'Optimism', ['optimism'])],
    },
    {
      key: 'otherNetworks',
      title: 'Other networks',
      items: [item('42161', 'Arbitrum', ['arbitrum']), item('480', 'World Chain', ['worldchain'])],
    },
  ]
}

function renderList(
  props: Partial<ComponentProps<typeof SearchableOptionListCompat>> = {},
  { onSelect }: { onSelect?: (id: string) => void } = {},
): ReturnType<typeof render> {
  return render(<SearchableOptionListCompat isOpen sections={networkSections({ onSelect })} {...props} />)
}

function visibleRowLabels(): string[] {
  return [...document.querySelectorAll(ROW_SELECTOR)].map((row) => row.textContent)
}

describe('SearchableOptionListCompat — search semantics (legacy NetworkFilterV2 parity)', () => {
  it('renders every section row and the sticky tier headers with no query', () => {
    renderList()
    expect(visibleRowLabels()).toEqual(['All networks', 'Ethereum', 'Optimism', 'Arbitrum', 'World Chain'])
    const headers = [...document.querySelectorAll(HEADER_SELECTOR)].map((h) => h.textContent)
    expect(headers).toEqual(['Your balances', 'Other networks'])
  })

  it('filters by word prefix across label and keywords, hiding emptied sections (header included)', () => {
    renderList()
    const input = document.querySelector(INPUT_SELECTOR) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'arb' } })
    expect(visibleRowLabels()).toEqual(['Arbitrum'])
    // The emptied "Your balances" section disappears with its header.
    const headers = [...document.querySelectorAll(HEADER_SELECTOR)].map((h) => h.textContent)
    expect(headers).toEqual(['Other networks'])
  })

  it('matches the All-networks pseudo-option as a searchable row (legacy shouldIncludeAllNetworksOption)', () => {
    renderList()
    const input = document.querySelector(INPUT_SELECTOR) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'all' } })
    expect(visibleRowLabels()).toEqual(['All networks'])
  })

  it('does not match mid-word substrings', () => {
    renderList()
    const input = document.querySelector(INPUT_SELECTOR) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'thereum' } })
    expect(visibleRowLabels()).toEqual([])
  })

  it('shows the empty state (with the query echoed) when nothing matches, and honors a custom label', () => {
    renderList({ noResultsLabel: 'Nothing here' })
    const input = document.querySelector(INPUT_SELECTOR) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'zzz' } })
    expect(screen.getByText('Nothing here')).toBeTruthy()
  })

  it('clears the query when the host closes (legacy clear-on-close effect)', () => {
    const sections = networkSections({})
    const { rerender } = render(<SearchableOptionListCompat isOpen sections={sections} />)
    const input = document.querySelector(INPUT_SELECTOR) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'arb' } })
    expect(input.value).toBe('arb')
    rerender(<SearchableOptionListCompat isOpen={false} sections={sections} />)
    rerender(<SearchableOptionListCompat isOpen sections={sections} />)
    const reopened = document.querySelector(INPUT_SELECTOR) as HTMLInputElement
    expect(reopened.value).toBe('')
    expect(visibleRowLabels()).toEqual(['All networks', 'Ethereum', 'Optimism', 'Arbitrum', 'World Chain'])
  })

  it('autofocuses the input by default and suppresses it in the sheet presentation (autoFocus-unless-sheet)', () => {
    renderList()
    expect(document.activeElement).toBe(document.querySelector(INPUT_SELECTOR))
    cleanup()
    renderList({ isSheet: true })
    expect(document.activeElement).not.toBe(document.querySelector(INPUT_SELECTOR))
  })

  it('uses the default placeholder and honors an override (host-injected i18n, ledgered)', () => {
    renderList()
    expect((document.querySelector(INPUT_SELECTOR) as HTMLInputElement).placeholder).toBe('Search')
    cleanup()
    renderList({ searchPlaceholder: 'Search networks' })
    expect((document.querySelector(INPUT_SELECTOR) as HTMLInputElement).placeholder).toBe('Search networks')
  })
})

describe('SearchableOptionListCompat — keyboard navigation + roles (the ledgered a11y upgrade)', () => {
  it('exposes combobox/listbox/option roles with aria wiring', () => {
    renderList()
    const input = document.querySelector(INPUT_SELECTOR) as HTMLInputElement
    expect(input.getAttribute('role')).toBe('combobox')
    expect(input.getAttribute('aria-expanded')).toBe('true')
    const listbox = screen.getByRole('listbox')
    expect(input.getAttribute('aria-controls')).toBe(listbox.id)
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(5)
  })

  it('ArrowDown/ArrowUp move the active option (aria-activedescendant), Enter selects it', () => {
    const onSelect = vi.fn()
    renderList({}, { onSelect })
    const input = document.querySelector(INPUT_SELECTOR) as HTMLInputElement
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const options = screen.getAllByRole('option')
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0]?.id)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input.getAttribute('aria-activedescendant')).toBe(options[1]?.id)
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0]?.id)
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('all')
  })

  it('End/Home jump to the last/first visible option and the active option follows the filter', () => {
    const onSelect = vi.fn()
    renderList({}, { onSelect })
    const input = document.querySelector(INPUT_SELECTOR) as HTMLInputElement
    fireEvent.keyDown(input, { key: 'End' })
    expect(input.getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option').at(-1)?.id)
    fireEvent.keyDown(input, { key: 'Home' })
    expect(input.getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[0]?.id)
    // Typing re-filters; the previous active index cannot point at a hidden row.
    fireEvent.change(input, { target: { value: 'world' } })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('480')
  })

  it('Enter without an active option is a no-op (no accidental selection)', () => {
    const onSelect = vi.fn()
    renderList({}, { onSelect })
    const input = document.querySelector(INPUT_SELECTOR) as HTMLInputElement
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSelect).not.toHaveBeenCalled()
  })
})

describe('OptionRowCompat — slot placement + interaction (legacy NetworkOption grammar)', () => {
  it('renders logo, label, badge, and the trailing checkmark when selected', () => {
    render(
      <OptionRowCompat
        label="Ethereum"
        logo={<img data-testid="logo" alt="" />}
        badge={<span data-testid="badge">New</span>}
        isSelected
        onPress={() => undefined}
      />,
    )
    expect(screen.getByTestId('logo')).toBeTruthy()
    expect(screen.getByTestId('badge')).toBeTruthy()
    expect(document.querySelector('[data-slot="option-row-check"]')).toBeTruthy()
  })

  it('reserves the trailing box when unselected and lets trailingElement override it', () => {
    render(<OptionRowCompat label="Ethereum" isSelected={false} onPress={() => undefined} />)
    expect(document.querySelector('[data-slot="option-row-check"]')).toBeNull()
    expect(document.querySelector('[data-slot="option-row-trailing"]')).toBeTruthy()
    cleanup()
    render(
      <OptionRowCompat
        label="Ethereum"
        trailingElement={<span data-testid="custom-trailing" />}
        onPress={() => undefined}
      />,
    )
    expect(screen.getByTestId('custom-trailing')).toBeTruthy()
  })

  it('renders a stacked logo pile for the subset "N networks" variant', () => {
    render(
      <OptionRowCompat
        label="3 networks"
        logoPile={[<i key="a" data-testid="pile-a" />, <i key="b" data-testid="pile-b" />]}
        onPress={() => undefined}
      />,
    )
    expect(screen.getByTestId('pile-a')).toBeTruthy()
    expect(screen.getByTestId('pile-b')).toBeTruthy()
    expect(document.querySelector('[data-slot="option-row-pile"]')).toBeTruthy()
  })

  it('dispatches onPress on click and detaches the handler while disabled', () => {
    const onPress = vi.fn()
    render(<OptionRowCompat label="Ethereum" onPress={onPress} />)
    fireEvent.click(document.querySelector(ROW_SELECTOR) as HTMLElement)
    expect(onPress).toHaveBeenCalledTimes(1)
    cleanup()
    const onPressDisabled = vi.fn()
    render(<OptionRowCompat label="Ethereum" disabled onPress={onPressDisabled} />)
    fireEvent.click(document.querySelector(ROW_SELECTOR) as HTMLElement)
    expect(onPressDisabled).not.toHaveBeenCalled()
  })
})

describe('SelectAllClearHeaderCompat — the multi-select CTA row (sandbox spec)', () => {
  it('dispatches onSelectAll/onClear and disables Select all when everything is selected', () => {
    const onSelectAll = vi.fn()
    const onClear = vi.fn()
    render(<SelectAllClearHeaderCompat onSelectAll={onSelectAll} onClear={onClear} />)
    fireEvent.click(screen.getByText('Select all'))
    fireEvent.click(screen.getByText('Clear'))
    expect(onSelectAll).toHaveBeenCalledTimes(1)
    expect(onClear).toHaveBeenCalledTimes(1)
    cleanup()
    render(
      <SelectAllClearHeaderCompat selectAllDisabled showClear={false} onSelectAll={onSelectAll} onClear={onClear} />,
    )
    expect((screen.getByText('Select all') as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByText('Clear')).toBeNull()
  })

  it('honors label overrides (host-injected i18n, ledgered)', () => {
    render(
      <SelectAllClearHeaderCompat
        selectAllLabel="Alles auswählen"
        clearLabel="Leeren"
        onSelectAll={() => undefined}
        onClear={() => undefined}
      />,
    )
    expect(screen.getByText('Alles auswählen')).toBeTruthy()
    expect(screen.getByText('Leeren')).toBeTruthy()
  })
})

describe('SearchableOptionListCompat — sticky headers anchored to the search input (2026-07 design review)', () => {
  it('drops the input bottom padding when titled sections render sticky (the header anchors flush, no see-through gap)', () => {
    renderList()
    const wrapper = document.querySelector('[data-slot="command-input-wrapper"]') as HTMLElement
    expect(wrapper.className).toContain('pb-0')
  })

  it('keeps the legacy 8px input padding for flat lists and for the sheet leg (no sticky headers in play)', () => {
    renderList({ sections: [networkSections({})[0] as OptionListSectionCompat] })
    const flatWrapper = document.querySelector('[data-slot="command-input-wrapper"]') as HTMLElement
    expect(flatWrapper.className).not.toContain('pb-0')
    cleanup()
    renderList({ isSheet: true })
    const sheetWrapper = document.querySelector('[data-slot="command-input-wrapper"]') as HTMLElement
    expect(sheetWrapper.className).not.toContain('pb-0')
  })

  it('the option-list scroll div is the single scroller (the recipe list is overflow-visible so headers pin to its top)', () => {
    renderList()
    const list = document.querySelector('[data-slot="option-list-listbox"]') as HTMLElement
    expect(list.className).toContain('overflow-visible')
    expect((document.querySelector('[data-slot="option-list-scroll"]') as HTMLElement).contains(list)).toBe(true)
  })
})

describe('SearchableOptionListCompat — bottom scroll fade (2026-07 design review)', () => {
  const FADE_SELECTOR = '[data-slot="option-list-bottom-fade"]'

  function mockScrollExtent(el: HTMLElement, { scrollHeight, clientHeight }: Record<string, number>): void {
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight })
    Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight })
  }

  it('never renders while the list does not overflow (jsdom default: zero extent)', () => {
    renderList()
    expect(document.querySelector(FADE_SELECTOR)).toBeNull()
  })

  it('shows while scrollable content remains below, and hides IMMEDIATELY on reaching the end', () => {
    renderList()
    const scroller = document.querySelector('[data-slot="option-list-scroll"]') as HTMLElement
    mockScrollExtent(scroller, { scrollHeight: 500, clientHeight: 320 })
    fireEvent.scroll(scroller, { target: { scrollTop: 0 } })
    expect(document.querySelector(FADE_SELECTOR)).toBeTruthy()
    fireEvent.scroll(scroller, { target: { scrollTop: 180 } })
    expect(document.querySelector(FADE_SELECTOR)).toBeNull()
    fireEvent.scroll(scroller, { target: { scrollTop: 60 } })
    expect(document.querySelector(FADE_SELECTOR)).toBeTruthy()
  })

  it('overlays without intercepting clicks and paints the 24px surface1 → transparent ramp', () => {
    renderList()
    const scroller = document.querySelector('[data-slot="option-list-scroll"]') as HTMLElement
    mockScrollExtent(scroller, { scrollHeight: 500, clientHeight: 320 })
    fireEvent.scroll(scroller, { target: { scrollTop: 0 } })
    const fade = document.querySelector(FADE_SELECTOR) as HTMLElement
    expect(fade.getAttribute('aria-hidden')).toBe('true')
    for (const cls of ['pointer-events-none', 'absolute', 'bottom-0', 'h-[24px]', 'from-surface1', 'to-surface1/0']) {
      expect(fade.className).toContain(cls)
    }
  })
})

describe('option-list-compat platform legs — export parity', () => {
  it('the native leg exports every runtime symbol the web leg exports (bundler-resolution parity)', async () => {
    const [nativeLeg, webLeg] = await Promise.all([
      import('../../../../mycelium/src/option-list-compat/index.native'),
      import('../../../../mycelium/src/option-list-compat/index.web'),
    ])
    expect(Object.keys(nativeLeg).sort()).toEqual(Object.keys(webLeg).sort())
    // Pure data / pure functions are REAL on native (loud throws stay
    // reserved for the web-only components and className compilers).
    expect(nativeLeg.normalizeOptionSearchQuery(' A  B ')).toBe(webLeg.normalizeOptionSearchQuery(' A  B '))
    expect(nativeLeg.optionMatchesSearchQuery({ label: 'Ethereum' }, 'eth')).toBe(true)
    expect(() => (nativeLeg.SearchableOptionListCompat as () => never)()).toThrow(/web-only/)
  })
})

describe('option-list exclusions ledger', () => {
  it('stays non-empty and documented (no silent deltas)', () => {
    expect(OPTION_LIST_PARITY_EXCLUSIONS.length).toBeGreaterThan(0)
    for (const exclusion of OPTION_LIST_PARITY_EXCLUSIONS) {
      expect(exclusion.reason.length).toBeGreaterThan(20)
      expect(exclusion.standIn.length).toBeGreaterThan(20)
    }
  })
})
