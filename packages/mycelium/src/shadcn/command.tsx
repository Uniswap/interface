/**
 * Command — shadcn-style searchable list (the cmdk anatomy) built directly
 * on the WAI-ARIA combobox/listbox pattern with mycelium Tailwind tokens
 * (INFRA-3021 shadcn set). No cmdk dependency: Base UI has no filterable
 * list primitive (Menu typeahead cannot host an input), so the engine —
 * word-prefix filtering, group auto-hiding, empty state,
 * aria-activedescendant keyboard navigation with clamp semantics — lives
 * here, and the NetworkSelector compat adapter rides it.
 *
 * Anatomy: Command / CommandInput / CommandList / CommandGroup /
 * CommandItem / CommandEmpty / CommandSeparator / CommandShortcut.
 *
 * Semantics (pinned by the recipes behavior suite):
 * - filtering: default word-prefix matching over `value` + `keywords`
 *   (`optionMatchesSearchQuery` — the legacy NetworkFilterV2 port); empty
 *   query matches everything; `filter` prop overrides;
 * - groups hide (heading included) when every child item is filtered out;
 * - CommandEmpty renders only while no item is visible;
 * - ArrowUp/Down move the active option without wrapping, Home/End jump,
 *   Enter selects the active option and is a no-op without one; the active
 *   option resets when the query changes;
 * - `render` on CommandItem composes the option semantics onto a custom
 *   element (Base UI's render-prop idiom) — the compat option rows use it.
 *
 * Class strings are FULL literals collected in `COMMAND_RECIPE_CLASS_NAMES`
 * (static extraction + the recipes classes-existence suite).
 */
'use client'
// oxlint-disable react/forbid-elements -- the recipe IS the raw DOM boundary
import { SearchIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '../cn'
import { optionMatchesSearchQuery } from './filter'

export const COMMAND_RECIPE_CLASS_NAMES = {
  root: 'flex min-h-0 w-full flex-col overflow-hidden rounded-[16px] bg-surface1 text-neutral1',
  inputWrapper: 'relative flex flex-row items-center px-[4px] pb-[8px]',
  inputIcon: 'pointer-events-none absolute left-[16px] flex text-neutral2',
  input:
    'w-full rounded-[16px] border border-surface3 bg-surface2 py-[8px] pr-[12px] pl-[40px] text-[16px] leading-[24px] text-neutral1 outline-none placeholder:text-neutral2',
  list: 'flex min-h-0 flex-col gap-[4px] overflow-x-hidden overflow-y-auto pt-[4px] pb-[6px] pl-[2px]',
  groupHeading: 'bg-surface1 px-[8px] pt-[8px] pb-[4px] text-[12px] leading-[16px] text-neutral2',
  item: 'flex cursor-pointer flex-row items-center justify-between gap-[12px] rounded-[8px] px-[8px] py-[10px] text-[16px] leading-[24px] text-neutral1 select-none aria-disabled:pointer-events-none aria-disabled:opacity-60 data-active:bg-surface2 hover:bg-surface2',
  empty: 'flex flex-col items-center px-[8px] py-[12px] pb-[18px] text-center text-[16px] leading-[24px] text-neutral2',
  separator: 'my-[6px] h-px w-full bg-surface3',
  shortcut: 'ml-auto text-[12px] leading-[16px] tracking-widest text-neutral3',
} as const

export type CommandFilter = (item: { value: string; keywords?: string[] }, query: string) => boolean

const defaultFilter: CommandFilter = (item, query) =>
  optionMatchesSearchQuery({ label: item.value, keywords: item.keywords }, query)

interface CommandItemRegistration {
  node: HTMLElement | null
  disabled: boolean
  onSelect: (() => void) | undefined
}

interface CommandContextValue {
  listId: string
  query: string
  setQuery: (query: string) => void
  filter: CommandFilter
  activeId: string | undefined
  setActiveId: (id: string | undefined) => void
  itemsRef: React.MutableRefObject<Map<string, CommandItemRegistration>>
  reportVisibility: (delta: number) => void
  visibleCount: number
}

const CommandContext = React.createContext<CommandContextValue | null>(null)

function useCommandContext(part: string): CommandContextValue {
  const context = React.useContext(CommandContext)
  if (context === null) {
    throw new Error(`${part} must be rendered inside <Command>`)
  }
  return context
}

interface CommandGroupContextValue {
  reportVisibility: (delta: number) => void
}

const CommandGroupContext = React.createContext<CommandGroupContextValue | null>(null)

/** Visible items in DOM order (registration order is not render order under filtering). */
function orderedVisibleEntries(
  itemsRef: React.MutableRefObject<Map<string, CommandItemRegistration>>,
): Array<[string, CommandItemRegistration]> {
  return [...itemsRef.current.entries()]
    .filter(([, entry]) => entry.node !== null && !entry.disabled)
    .sort(([, a], [, b]) => {
      if (a.node === null || b.node === null || a.node === b.node) {
        return 0
      }
      // oxlint-disable-next-line no-bitwise -- compareDocumentPosition is a bitmask API
      return (a.node.compareDocumentPosition(b.node) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 ? -1 : 1
    })
}

function Command({
  className,
  query: controlledQuery,
  onQueryChange,
  filter = defaultFilter,
  ...props
}: React.ComponentProps<'div'> & {
  /** Controlled search query; omit for internal state. */
  query?: string
  onQueryChange?: (query: string) => void
  /** Match predicate; defaults to the word-prefix matcher (the legacy NetworkFilterV2 port). */
  filter?: CommandFilter
}): React.JSX.Element {
  const listId = React.useId()
  const [internalQuery, setInternalQuery] = React.useState('')
  const query = controlledQuery ?? internalQuery
  const [activeId, setActiveId] = React.useState<string | undefined>(undefined)
  const [visibleCount, setVisibleCount] = React.useState(0)
  const itemsRef = React.useRef<Map<string, CommandItemRegistration>>(new Map())

  // A CONTROLLED query can change without passing through setQuery (the host
  // sets the prop directly), which would leave aria-activedescendant pointing
  // at a filtered-out row. Reset during render on any query change (the
  // render-phase adjustment pattern; setQuery's own reset stays for clarity).
  const [lastSeenQuery, setLastSeenQuery] = React.useState(query)
  if (lastSeenQuery !== query) {
    setLastSeenQuery(query)
    setActiveId(undefined)
  }

  const setQuery = React.useCallback(
    (next: string): void => {
      setInternalQuery(next)
      onQueryChange?.(next)
      // The previous active option cannot point at a filtered-out row.
      setActiveId(undefined)
    },
    [onQueryChange],
  )

  const reportVisibility = React.useCallback((delta: number): void => {
    setVisibleCount((count) => count + delta)
  }, [])

  const context = React.useMemo(
    () => ({ listId, query, setQuery, filter, activeId, setActiveId, itemsRef, reportVisibility, visibleCount }),
    [listId, query, setQuery, filter, activeId, reportVisibility, visibleCount],
  )

  return (
    <CommandContext.Provider value={context}>
      <div data-slot="command" className={cn(COMMAND_RECIPE_CLASS_NAMES.root, className)} {...props} />
    </CommandContext.Provider>
  )
}

function CommandInput({
  className,
  wrapperClassName,
  showSearchIcon = true,
  onChange,
  onKeyDown,
  ...props
}: React.ComponentProps<'input'> & {
  wrapperClassName?: string
  showSearchIcon?: boolean
}): React.JSX.Element {
  const { listId, query, setQuery, activeId, setActiveId, itemsRef } = useCommandContext('CommandInput')

  const moveActive = (position: 'next' | 'prev' | 'first' | 'last'): void => {
    const entries = orderedVisibleEntries(itemsRef)
    if (entries.length === 0) {
      setActiveId(undefined)
      return
    }
    const currentIndex = entries.findIndex(([id]) => id === activeId)
    let nextIndex: number
    switch (position) {
      case 'first':
        nextIndex = 0
        break
      case 'last':
        nextIndex = entries.length - 1
        break
      case 'next':
        nextIndex = Math.min(currentIndex + 1, entries.length - 1)
        break
      case 'prev':
        nextIndex = Math.max(currentIndex - 1, 0)
        break
    }
    const nextEntry = entries[nextIndex]
    setActiveId(nextEntry?.[0])
    // aria-activedescendant moves a HIGHLIGHT, not focus — the browser only
    // auto-scrolls real focus, so an overflowing list must be scrolled by hand.
    // (typeof guard: jsdom elements have no scrollIntoView.)
    const nextNode = nextEntry?.[1].node
    if (typeof nextNode?.scrollIntoView === 'function') {
      nextNode.scrollIntoView({ block: 'nearest' })
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveActive('next')
        break
      case 'ArrowUp':
        event.preventDefault()
        moveActive('prev')
        break
      case 'Home':
        event.preventDefault()
        moveActive('first')
        break
      case 'End':
        event.preventDefault()
        moveActive('last')
        break
      case 'Enter': {
        const active = activeId === undefined ? undefined : itemsRef.current.get(activeId)
        if (active !== undefined && !active.disabled) {
          event.preventDefault()
          active.onSelect?.()
        }
        break
      }
      default:
        break
    }
    onKeyDown?.(event)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setQuery(event.target.value)
    onChange?.(event)
  }

  return (
    <div data-slot="command-input-wrapper" className={cn(COMMAND_RECIPE_CLASS_NAMES.inputWrapper, wrapperClassName)}>
      {showSearchIcon && (
        <span className={COMMAND_RECIPE_CLASS_NAMES.inputIcon}>
          <SearchIcon className="size-[20px]" />
        </span>
      )}
      <input
        data-slot="command-input"
        type="text"
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-activedescendant={activeId}
        aria-autocomplete="list"
        value={query}
        className={cn(COMMAND_RECIPE_CLASS_NAMES.input, className)}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
    </div>
  )
}

function CommandList({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  const { listId } = useCommandContext('CommandList')
  return (
    <div
      id={listId}
      data-slot="command-list"
      role="listbox"
      className={cn(COMMAND_RECIPE_CLASS_NAMES.list, className)}
      {...props}
    />
  )
}

function CommandEmpty({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element | null {
  const { visibleCount } = useCommandContext('CommandEmpty')
  if (visibleCount > 0) {
    return null
  }
  return <div data-slot="command-empty" className={cn(COMMAND_RECIPE_CLASS_NAMES.empty, className)} {...props} />
}

function CommandGroup({
  className,
  heading,
  headingProps,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  heading?: React.ReactNode
  /** Spread onto the heading element last, so className/data-* are overridable. */
  headingProps?: React.HTMLAttributes<HTMLDivElement> & { [key: `data-${string}`]: string | undefined }
}): React.JSX.Element {
  const { reportVisibility: reportToRoot } = useCommandContext('CommandGroup')
  const [visibleChildren, setVisibleChildren] = React.useState(0)

  const reportVisibility = React.useCallback(
    (delta: number): void => {
      setVisibleChildren((count) => count + delta)
      reportToRoot(delta)
    },
    [reportToRoot],
  )
  const groupContext = React.useMemo(() => ({ reportVisibility }), [reportVisibility])

  return (
    <CommandGroupContext.Provider value={groupContext}>
      {/* Children stay mounted while hidden so filtered items can re-register;
          the heading UNMOUNTS so an emptied group leaves no DOM footprint. */}
      <div
        data-slot="command-group"
        role="presentation"
        hidden={visibleChildren === 0}
        className={className}
        {...props}
      >
        {heading !== undefined && visibleChildren > 0 && (
          <div
            data-slot="command-group-heading"
            role="presentation"
            className={COMMAND_RECIPE_CLASS_NAMES.groupHeading}
            {...headingProps}
          >
            {heading}
          </div>
        )}
        {children}
      </div>
    </CommandGroupContext.Provider>
  )
}

function CommandItem({
  className,
  activeClassName,
  value,
  keywords,
  disabled = false,
  selected,
  onSelect,
  render,
  children,
  onClick,
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & {
  /** The searchable text (the row label). */
  value: string
  /** Additional search fields. */
  keywords?: string[]
  disabled?: boolean
  /** aria-selected (the CHECKED row, not the keyboard highlight — that is data-active). */
  selected?: boolean
  onSelect?: () => void
  /** Extra classes applied while the item is the active option. */
  activeClassName?: string
  /** Compose the option semantics onto a custom element (Base UI render idiom). */
  render?: React.ReactElement<Record<string, unknown>>
  children?: React.ReactNode
}): React.JSX.Element | null {
  const { listId, query, filter, activeId, itemsRef, reportVisibility } = useCommandContext('CommandItem')
  const group = React.useContext(CommandGroupContext)
  const reactId = React.useId()
  const id = `${listId}-item-${reactId}`
  const nodeRef = React.useRef<HTMLElement | null>(null)

  const visible = filter({ value, keywords }, query)
  const isActive = activeId === id

  const onSelectRef = React.useRef(onSelect)
  onSelectRef.current = onSelect

  const report = group === null ? reportVisibility : group.reportVisibility
  React.useLayoutEffect(() => {
    if (!visible) {
      return undefined
    }
    const items = itemsRef.current
    items.set(id, { node: nodeRef.current, disabled, onSelect: () => onSelectRef.current?.() })
    report(1)
    return (): void => {
      items.delete(id)
      report(-1)
    }
  }, [visible, disabled, id, itemsRef, report])

  if (!visible) {
    return null
  }

  // cloneElement's config REPLACES the element's own props — className is
  // hand-composed above, and the two callables must be composed here too, or
  // a render element's own onClick/ref silently die.
  const renderOnClick = render?.props['onClick']
  const renderRef = render?.props['ref']

  const setNode = (node: HTMLElement | null): void => {
    nodeRef.current = node
    const entry = itemsRef.current.get(id)
    if (entry !== undefined) {
      entry.node = node
    }
    if (typeof renderRef === 'function') {
      renderRef(node)
    } else if (renderRef !== null && typeof renderRef === 'object' && 'current' in renderRef) {
      ;(renderRef as React.MutableRefObject<HTMLElement | null>).current = node
    }
  }

  const handleClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (typeof renderOnClick === 'function') {
      renderOnClick(event)
    }
    onClick?.(event)
    if (!disabled) {
      onSelect?.()
    }
  }

  const optionProps = {
    id,
    role: 'option',
    'aria-selected': selected === true,
    'aria-disabled': disabled || undefined,
    'data-active': isActive ? '' : undefined,
    onClick: handleClick,
    ref: setNode,
  }

  if (render !== undefined) {
    const renderClassName = render.props['className']
    return React.cloneElement(render, {
      ...props,
      ...optionProps,
      // Same composition as the default branch (minus the recipe chrome the
      // rendered element owns): element classes, then active, then the
      // component's own className — both paths honor it.
      className: cn(
        typeof renderClassName === 'string' ? renderClassName : undefined,
        isActive && activeClassName,
        className,
      ),
    })
  }

  return (
    <div
      {...props}
      {...optionProps}
      data-slot="command-item"
      className={cn(COMMAND_RECIPE_CLASS_NAMES.item, isActive && activeClassName, className)}
    >
      {children}
    </div>
  )
}

function CommandSeparator({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="command-separator"
      role="separator"
      className={cn(COMMAND_RECIPE_CLASS_NAMES.separator, className)}
      {...props}
    />
  )
}

function CommandShortcut({ className, ...props }: React.ComponentProps<'span'>): React.JSX.Element {
  return <span data-slot="command-shortcut" className={cn(COMMAND_RECIPE_CLASS_NAMES.shortcut, className)} {...props} />
}

export {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
}
