import { KeyboardEvent as ReactKeyboardEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Modal } from '~/terminal/components/Modal'
import { SparklineCell, TrendDirection, trendColor } from '~/terminal/components/SparklineCell'
import { terminalColors, terminalFonts, terminalLayout } from '~/terminal/theme/tokens'

/** Signed change readout for a token result, e.g. `{ label: '+2.4%', direction: 'up' }`. */
export interface CommandPaletteChange {
  label: string
  direction: TrendDirection
}

/** Token/pool result row (B11 "Trending tokens"): identity · mono price · % change · sparkline · Swap. */
export interface CommandPaletteTokenItem {
  kind: 'token'
  id: string
  /** 26px round logo (real token logo node). Falls back to a neutral circle. */
  icon?: ReactNode
  name: string
  /** Ticker, rendered mono 11px `#98A0AC` next to the name. */
  symbol?: string
  /** Pre-formatted price, e.g. "$3,492.10". */
  price: string
  change?: CommandPaletteChange
  sparkline?: readonly number[]
  /** Green pill on the right, e.g. "Swap". Omit for no button. */
  actionLabel?: string
  onAction?: () => void
  onSelect?: () => void
}

/** Quick-action row (B11 "Quick actions"): icon tile · label · keyboard hint. */
export interface CommandPaletteActionItem {
  kind: 'action'
  id: string
  /** 15px stroke icon node, centered in a 28×28 tile. */
  icon?: ReactNode
  /** Tile background. Default `#E9FBEF` (green tile from the prototype). */
  iconBackground?: string
  label: string
  /** Keyboard hint chip, e.g. "↵" or "L". */
  hint?: string
  onSelect?: () => void
}

export type CommandPaletteItem = CommandPaletteTokenItem | CommandPaletteActionItem

export interface CommandPaletteGroup {
  id: string
  /** Uppercase mono group label, e.g. "TRENDING TOKENS", "QUICK ACTIONS". */
  label: string
  items: readonly CommandPaletteItem[]
}

export interface CommandPaletteTab {
  id: string
  label: string
}

export interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  /** Controlled query. Search itself happens outside — this component is UI only. */
  query: string
  onQueryChange: (query: string) => void
  placeholder?: string
  /** Filter tabs (B11: All / Tokens / Pools / Actions). Omit to hide the tab row. */
  tabs?: readonly CommandPaletteTab[]
  activeTabId?: string
  onTabChange?: (tabId: string) => void
  /** Result groups. Everything is passed in — no fetching inside. */
  groups: readonly CommandPaletteGroup[]
  loading?: boolean
  error?: string
  /** Shown when all groups are empty. Default: `No results` (+ the query when present). */
  emptyMessage?: string
  /** Right side of the footer hint bar. Default "HookSwap ⌘K". */
  footerBrand?: string
}

/**
 * ⌘K command palette — pixel-perfect to B11: 640px card 70px from the top over
 * the modal scrim, search header (17px input, brand-green caret, `esc` chip),
 * filter-tab row, grouped results (token rows with mono price/% + sparkline +
 * green Swap pill; action rows with icon tile + keyboard hint), and the mono
 * keyboard-hint footer. ↑/↓ navigate, ↵ selects, Esc closes. UI only — results
 * arrive via props.
 */
export function CommandPalette({
  open,
  onClose,
  query,
  onQueryChange,
  placeholder = 'Search markets, tokens…',
  tabs,
  activeTabId,
  onTabChange,
  groups,
  loading = false,
  error,
  emptyMessage,
  footerBrand = 'HookSwap ⌘K',
}: CommandPaletteProps): JSX.Element | null {
  const inputRef = useRef<HTMLInputElement>(null)
  const [highlightIndex, setHighlightIndex] = useState(0)

  const flatItems = useMemo(() => groups.flatMap((group) => group.items), [groups])
  const itemCount = flatItems.length

  // Reset highlight when contents change or the palette opens.
  useEffect(() => {
    setHighlightIndex(0)
  }, [open, query, groups])

  // Focus the input on open.
  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  if (!open) {
    return null
  }

  const isEmpty = !loading && !error && itemCount === 0

  const selectItem = (item: CommandPaletteItem): void => {
    item.onSelect?.()
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => (itemCount === 0 ? 0 : (i + 1) % itemCount))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => (itemCount === 0 ? 0 : (i - 1 + itemCount) % itemCount))
    } else if (e.key === 'Enter') {
      const item = flatItems[highlightIndex]
      if (item) {
        e.preventDefault()
        selectItem(item)
      }
    }
  }

  let runningIndex = -1

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={terminalLayout.commandPaletteWidth}
      radius={18}
      align="top"
      topOffset={70}
      ariaLabel="Command palette"
    >
      <div onKeyDown={onKeyDown} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Search header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '18px 20px',
            borderBottom: `1px solid ${terminalColors.line2}`,
            flexShrink: 0,
          }}
        >
          <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={terminalColors.ink} strokeWidth={2}>
            <circle cx={11} cy={11} r={7} />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e): void => onQueryChange(e.target.value)}
            placeholder={placeholder}
            aria-label="Search"
            style={{
              flex: 1,
              minWidth: 0,
              fontFamily: terminalFonts.sans,
              fontSize: 17,
              color: terminalColors.ink,
              caretColor: terminalColors.brandGreen,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: 0,
            }}
          />
          <span
            style={{
              fontFamily: terminalFonts.mono,
              fontSize: 11,
              color: terminalColors.ink3Alt,
              background: terminalColors.panel2,
              padding: '4px 8px',
              borderRadius: 6,
              flexShrink: 0,
            }}
          >
            esc
          </span>
        </div>

        {/* Filter tabs */}
        {tabs && tabs.length > 0 ? (
          <div
            role="tablist"
            style={{
              display: 'flex',
              gap: 6,
              padding: '12px 20px',
              borderBottom: `1px solid ${terminalColors.line3}`,
              flexShrink: 0,
            }}
          >
            {tabs.map((tab) => {
              const active = tab.id === activeTabId
              return (
                <span
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  tabIndex={0}
                  onClick={(): void => onTabChange?.(tab.id)}
                  onKeyDown={(e): void => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onTabChange?.(tab.id)
                    }
                  }}
                  style={{
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    color: active ? terminalColors.ink : terminalColors.ink2,
                    background: active ? terminalColors.panel2Alt : 'transparent',
                    padding: '6px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  {tab.label}
                </span>
              )
            })}
          </div>
        ) : null}

        {/* Results */}
        <div style={{ overflowY: 'auto', minHeight: 0 }}>
          {error ? (
            <div role="alert" style={{ padding: 28, textAlign: 'center', fontSize: 13, color: terminalColors.redDown }}>
              {error}
            </div>
          ) : loading ? (
            <div aria-busy="true" style={{ padding: '14px 20px 18px' }}>
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    height: 14,
                    borderRadius: 4,
                    background: terminalColors.line2,
                    margin: '14px 0',
                    width: `${78 - i * 9}%`,
                  }}
                />
              ))}
            </div>
          ) : isEmpty ? (
            <div style={{ padding: 28, textAlign: 'center', fontSize: 13, color: terminalColors.ink3Alt }}>
              {emptyMessage ?? (query ? `No results for “${query}”` : 'No results')}
            </div>
          ) : (
            groups
              .filter((group) => group.items.length > 0)
              .map((group, groupIndex) => (
              <div
                key={group.id}
                style={{
                  padding: groupIndex === 0 ? '14px 12px 6px' : '6px 12px 10px',
                  borderTop: groupIndex === 0 ? undefined : `1px solid ${terminalColors.line3}`,
                }}
              >
                <div
                  style={{
                    fontFamily: terminalFonts.mono,
                    fontSize: 10.5,
                    color: terminalColors.ink3Alt,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: groupIndex === 0 ? '0 8px 8px' : '8px 8px',
                  }}
                >
                  {group.label}
                </div>
                {group.items.map((item) => {
                  runningIndex += 1
                  const index = runningIndex
                  return (
                    <PaletteRow
                      key={item.id}
                      item={item}
                      highlighted={index === highlightIndex}
                      onHover={(): void => setHighlightIndex(index)}
                      onSelect={(): void => selectItem(item)}
                    />
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Keyboard-hint footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '11px 20px',
            borderTop: `1px solid ${terminalColors.line2}`,
            background: '#FAFBFC',
            fontFamily: terminalFonts.mono,
            fontSize: 11,
            color: terminalColors.ink3Alt,
            flexShrink: 0,
          }}
        >
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
          <span style={{ marginLeft: 'auto' }}>{footerBrand}</span>
        </div>
      </div>
    </Modal>
  )
}

function PaletteRow({
  item,
  highlighted,
  onHover,
  onSelect,
}: {
  item: CommandPaletteItem
  highlighted: boolean
  onHover: () => void
  onSelect: () => void
}): JSX.Element {
  const rowBase = {
    padding: '9px 8px',
    borderRadius: 9,
    cursor: 'pointer',
    background: highlighted ? terminalColors.panel : 'transparent',
  } as const

  if (item.kind === 'token') {
    return (
      <div
        role="option"
        aria-selected={highlighted}
        onMouseEnter={onHover}
        onClick={onSelect}
        style={{
          ...rowBase,
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr .8fr 70px 72px',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {item.icon ?? (
            <span
              style={{ width: 26, height: 26, borderRadius: '50%', background: terminalColors.panel2, flexShrink: 0 }}
            />
          )}
          <span style={{ fontWeight: 600, fontSize: 13.5, color: terminalColors.ink }}>{item.name}</span>
          {item.symbol ? (
            <span style={{ fontFamily: terminalFonts.mono, fontSize: 11, color: terminalColors.ink3Alt }}>
              {item.symbol}
            </span>
          ) : null}
        </div>
        <span
          style={{ textAlign: 'right', fontFamily: terminalFonts.mono, fontSize: 13, color: terminalColors.ink }}
        >
          {item.price}
        </span>
        <span
          style={{
            textAlign: 'right',
            fontFamily: terminalFonts.mono,
            fontSize: 12.5,
            color: item.change ? trendColor(item.change.direction) : terminalColors.ink3,
          }}
        >
          {item.change?.label ?? ''}
        </span>
        <span style={{ display: 'flex', justifyContent: 'center' }}>
          {item.sparkline ? <SparklineCell data={item.sparkline} width={60} height={22} strokeWidth={2.2} /> : null}
        </span>
        <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {item.actionLabel ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(e): void => {
                e.stopPropagation()
                item.onAction?.()
              }}
              onKeyDown={(e): void => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  item.onAction?.()
                }
              }}
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: terminalColors.btnInk,
                background: terminalColors.brandGreen,
                padding: '6px 14px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              {item.actionLabel}
            </span>
          ) : null}
        </span>
      </div>
    )
  }

  return (
    <div
      role="option"
      aria-selected={highlighted}
      onMouseEnter={onHover}
      onClick={onSelect}
      style={{
        ...rowBase,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: item.iconBackground ?? terminalColors.greenBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {item.icon}
        </span>
        <span style={{ fontSize: 13.5, fontWeight: 500, color: terminalColors.ink }}>{item.label}</span>
      </div>
      {item.hint ? (
        <span
          style={{
            fontFamily: terminalFonts.mono,
            fontSize: 10.5,
            color: terminalColors.ink3Alt,
            background: terminalColors.panel2,
            padding: '4px 8px',
            borderRadius: 6,
            flexShrink: 0,
          }}
        >
          {item.hint}
        </span>
      ) : null}
    </div>
  )
}
