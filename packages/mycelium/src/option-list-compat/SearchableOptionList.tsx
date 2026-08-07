/**
 * Web-only searchable option list (INFRA-3021 dropdown set): the legacy
 * `NetworkFilterDropdownContent` grammar — filter input (word-prefix match,
 * autoFocus-unless-sheet, clear-on-close), sticky tier section headers,
 * empty state — as a COMPAT ADAPTER over the shadcn Command recipe
 * (`../shadcn/command`), which owns the engine: word-prefix filtering,
 * group auto-hiding, and the WAI-ARIA combobox/listbox keyboard navigation
 * (the a11y upgrade the legacy content lacks entirely, ledgered).
 *
 * The adapter's job is the pinned legacy contract: the option-list data
 * slots, the byte-diffed compat classes, clear-on-close, and
 * autoFocus-unless-sheet — the option-list parity suites pass unchanged
 * against this implementation.
 */
// oxlint-disable react/forbid-elements -- the compat components ARE the raw DOM boundary (no Tamagui Flex here)
import * as React from 'react'
import { cn } from '../cn'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../shadcn/command'
import {
  OPTION_LIST_BOTTOM_FADE_CLASS_NAME,
  OPTION_LIST_EMPTY_STATE_CLASS_NAME,
  OPTION_LIST_SCROLL_CLASS_NAME,
  OPTION_LIST_SCROLL_SHELL_CLASS_NAME,
  OPTION_LIST_SEARCH_INPUT_CLASS_NAME,
  OPTION_ROW_ACTIVE_CLASS_NAME,
  optionListSectionHeaderClassName,
  optionListSectionHeaderTitleClassName,
} from './compile'
import { optionMatchesSearchQuery } from './filter'
import { OptionRowCompat } from './OptionRow'
import type { SearchableOptionListCompatProps } from './types'

const noop = (): void => undefined

/** Scrolled-to-end detection tolerance (fractional scroll positions on zoomed displays). */
const SCROLL_END_EPSILON_PX = 1

/** The legacy word-prefix semantics, adapted to the Command filter signature. */
function compatFilter(item: { value: string; keywords?: string[] }, query: string): boolean {
  return optionMatchesSearchQuery({ label: item.value, keywords: item.keywords }, query)
}

export function SearchableOptionListCompat({
  sections,
  isOpen,
  autoFocus,
  isSheet,
  searchPlaceholder = 'Search',
  noResultsLabel = 'No results found.',
  listClassName,
  fillAvailableHeight,
  stickyHeaders = true,
  onQueryChange,
  listTestID,
}: SearchableOptionListCompatProps): React.JSX.Element {
  const [query, setQuery] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  // Design review (2026-07): the 24px bottom scroll fade hides the moment the
  // list reaches its end (and never shows while the list does not overflow).
  const [isScrolledToEnd, setIsScrolledToEnd] = React.useState(true)

  const updateScrollFade = React.useCallback((): void => {
    const el = scrollRef.current
    if (el === null) {
      return
    }
    setIsScrolledToEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_END_EPSILON_PX)
  }, [])

  // Re-measure on every commit: filtering, section changes, and open/close all
  // change the scrollable extent (the state setter no-ops when unchanged).
  React.useEffect(updateScrollFade)

  // Legacy clear-on-close: the host's open state resets the query.
  React.useEffect(() => {
    if (!isOpen) {
      setQuery('')
    }
  }, [isOpen])

  // autoFocus-unless-sheet (legacy NetworkFilterV2.web autoFocus={!isMobileSheet}).
  const shouldAutoFocus = autoFocus ?? isSheet !== true
  React.useEffect(() => {
    if (isOpen && shouldAutoFocus) {
      inputRef.current?.focus()
    }
  }, [isOpen, shouldAutoFocus])

  const handleQueryChange = (next: string): void => {
    setQuery(next)
    onQueryChange?.(next)
  }

  const sticky = stickyHeaders && isSheet !== true
  // Design review (2026-07): the sticky tier headers must anchor tight to the
  // search input — no dead gap where content shows while scrolling. When
  // sticky headers are in play the input drops its own bottom padding; the
  // header's surface1 padding provides the spacing and paints over rows
  // scrolling beneath it.
  const anchorHeadersToInput = sticky && sections.some((section) => section.title !== undefined)

  return (
    <Command
      data-slot="searchable-option-list"
      query={query}
      filter={compatFilter}
      className={cn('rounded-none bg-transparent', fillAvailableHeight === true && 'flex-1')}
      onQueryChange={handleQueryChange}
    >
      <CommandInput
        ref={inputRef}
        data-slot="option-list-search-input"
        aria-label={searchPlaceholder}
        placeholder={searchPlaceholder}
        wrapperClassName={anchorHeadersToInput ? 'pb-0' : undefined}
        className={cn(OPTION_LIST_SEARCH_INPUT_CLASS_NAME, 'pl-[40px]')}
      />
      <div className={cn(OPTION_LIST_SCROLL_SHELL_CLASS_NAME, fillAvailableHeight === true && 'flex-1')}>
        <div
          ref={scrollRef}
          data-slot="option-list-scroll"
          className={cn(OPTION_LIST_SCROLL_CLASS_NAME, fillAvailableHeight === true && 'flex-1', listClassName)}
          onScroll={updateScrollFade}
        >
          <CommandEmpty data-slot="option-list-empty-state" className={OPTION_LIST_EMPTY_STATE_CLASS_NAME}>
            <span>{noResultsLabel}</span>
          </CommandEmpty>
          {/* The recipe list must not scroll on its own: this scroll div is the
              single scroller so the sticky headers pin to ITS top (flush under
              the search input) and the fade watches ITS scroll position. */}
          <CommandList data-slot="option-list-listbox" data-testid={listTestID} className="overflow-visible pt-0">
            {sections.map((section) => (
              <CommandGroup
                key={section.key}
                className="flex flex-col gap-[4px]"
                heading={
                  section.title === undefined ? undefined : (
                    <span className={optionListSectionHeaderTitleClassName()}>{section.title}</span>
                  )
                }
                headingProps={
                  section.title === undefined
                    ? undefined
                    : {
                        'data-slot': 'option-list-section-header',
                        className: optionListSectionHeaderClassName({ sticky }),
                      }
                }
              >
                {section.items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.label}
                    keywords={item.keywords}
                    disabled={item.disabled}
                    selected={item.isSelected === true}
                    activeClassName={OPTION_ROW_ACTIVE_CLASS_NAME}
                    render={
                      <OptionRowCompat
                        label={item.label}
                        logo={item.logo}
                        logoPile={item.logoPile}
                        badge={item.badge}
                        isSelected={item.isSelected}
                        disabled={item.disabled}
                        testID={item.testID}
                        // Selection is owned by CommandItem (click via the
                        // composed onClick, Enter via the engine) — a row-level
                        // onPress would double-fire it.
                        onPress={noop}
                      />
                    }
                    onSelect={item.onSelect}
                  />
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </div>
        {!isScrolledToEnd && (
          <div data-slot="option-list-bottom-fade" aria-hidden="true" className={OPTION_LIST_BOTTOM_FADE_CLASS_NAME} />
        )}
      </div>
    </Command>
  )
}
