import { CSSProperties, ReactNode, useState } from 'react'
import { ChainLogo } from '~/components/Logo/ChainLogo'
import { HookLogo } from '~/terminal/components/HookLogo'
import { ChainInfo } from '~/terminal/components/TopBar'
import { TerminalNavId } from '~/terminal/config/screens'
import { terminalColors, terminalFonts, terminalTokenGradients } from '~/terminal/theme/tokens'

/**
 * HookSwap Terminal — desktop TOP navigation bar (64px, dark).
 *
 * Replaces the former 226px left rail on desktop. Visually matched to the
 * marketing landing header (LandingScreen's own standalone header): hexagon +
 * wordmark logo, horizontal nav items (Trade / Markets / Earn / Portfolio /
 * Docs), a ⌘K search field, the live chain chip, and the green Connect button.
 *
 * The five handoff nav items map onto the app's real routes; secondary screens
 * (Positions / Locker / Referrals under Earn, Activity / Analytics under
 * Portfolio) hang off hover dropdowns, and every screen also stays reachable via
 * the ⌘K command palette. Settings is a small gear in the right cluster.
 *
 * Data wiring (search / chain / wallet / per-screen actions) mirrors TopBar so
 * TerminalShell can feed it the same live props.
 */

interface NavChild {
  label: string
  path: string
  navId: TerminalNavId
}

interface NavSection {
  label: string
  /** Primary route for the top-level item (internal). */
  path?: string
  navId?: TerminalNavId
  /** External link (opens a new tab) instead of an in-app route. */
  externalHref?: string
  /** Active-pill ids that light this section. */
  activeIds: TerminalNavId[]
  /** Secondary screens surfaced in a hover dropdown. */
  children?: NavChild[]
}

const DOCS_URL = 'https://docs.hookswap.org'
const LAUNCHPAD_URL = 'https://hookos.fun/atlas'

/** Handoff nav (Trade / Markets / Earn / Portfolio / Docs) → real routes. NO hooks. */
const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Trade',
    path: '/swap',
    navId: 'swap',
    activeIds: ['swap', 'limit', 'widget-builder'],
    children: [
      { label: 'Swap', path: '/swap', navId: 'swap' },
      { label: 'Limit', path: '/terminal/limit', navId: 'limit' },
      { label: 'Widget builder', path: '/terminal/widget', navId: 'widget-builder' },
    ],
  },
  { label: 'Markets', path: '/terminal/markets', navId: 'markets', activeIds: ['markets'] },
  {
    label: 'Earn',
    path: '/terminal/pools/new',
    navId: 'create-position',
    activeIds: ['create-position', 'positions', 'locker', 'referrals'],
    children: [
      { label: 'Pools', path: '/terminal/pools/new', navId: 'create-position' },
      { label: 'Positions', path: '/terminal/positions', navId: 'positions' },
      { label: 'Locker', path: '/terminal/locker', navId: 'locker' },
      { label: 'Referrals', path: '/terminal/referrals', navId: 'referrals' },
    ],
  },
  {
    label: 'Portfolio',
    path: '/terminal/portfolio',
    navId: 'portfolio',
    activeIds: ['portfolio', 'notifications', 'analytics'],
    children: [
      { label: 'Overview', path: '/terminal/portfolio', navId: 'portfolio' },
      { label: 'Activity', path: '/terminal/activity', navId: 'notifications' },
      { label: 'Analytics', path: '/terminal/analytics', navId: 'analytics' },
    ],
  },
  { label: 'Docs', externalHref: DOCS_URL, activeIds: [] },
  { label: 'Launchpad', externalHref: LAUNCHPAD_URL, activeIds: [] },
]

const FIELD_BASE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  background: terminalColors.panel,
  border: `1px solid ${terminalColors.line}`,
  borderRadius: 10,
}

export interface TopNavProps {
  /** Active screen id — drives the highlighted section. */
  activeId?: TerminalNavId
  /** Route handler (wired to react-router navigate). */
  onNavigate?: (path: string, id: TerminalNavId) => void
  /** Placeholder for the search field (opens the command palette). */
  searchPlaceholder?: string
  /** Open the command palette (⌘K). */
  onSearchClick?: () => void
  /** Connected chain summary. */
  chain?: ChainInfo
  /** Chain selector click (open the chain switcher). */
  onChainClick?: () => void
  /** Connected wallet summary. Omit → green "Connect" button. */
  wallet?: { addressShort: string }
  /** Disconnected click (open the wallet drawer to connect). */
  onConnectWallet?: () => void
  /** Connected click (toggle the account drawer). */
  onWalletClick?: () => void
  /** Per-screen / overlay actions (e.g. the chain switcher menu). */
  actions?: ReactNode
}

function NavItem({
  section,
  active,
  onNavigate,
}: {
  section: NavSection
  active: boolean
  onNavigate?: TopNavProps['onNavigate']
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const hasDropdown = Boolean(section.children && section.children.length > 0)

  const labelStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0 2px',
    height: 64,
    fontFamily: terminalFonts.sans,
    fontSize: 13.5,
    fontWeight: active ? 600 : 500,
    color: active ? terminalColors.ink : terminalColors.ink2,
    position: 'relative',
  }

  function activate(): void {
    if (section.externalHref) {
      window.open(section.externalHref, '_blank', 'noreferrer')
      return
    }
    if (section.path && section.navId) {
      onNavigate?.(section.path, section.navId)
    }
  }

  return (
    <div
      style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}
      onMouseEnter={() => hasDropdown && setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button type="button" onClick={activate} style={labelStyle}>
        {section.label}
        {section.externalHref ? (
          <span aria-hidden style={{ fontSize: 11, color: terminalColors.ink3Alt, lineHeight: 1 }}>
            ↗
          </span>
        ) : hasDropdown ? (
          <svg
            width={9}
            height={9}
            viewBox="0 0 24 24"
            fill="none"
            stroke={terminalColors.ink3Alt}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        ) : null}
        {/* Active-section underline */}
        {active ? (
          <span
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 2,
              borderRadius: '2px 2px 0 0',
              background: terminalColors.brandGreen,
            }}
          />
        ) : null}
      </button>

      {hasDropdown && open ? (
        <div
          style={{
            position: 'absolute',
            top: 58,
            left: -10,
            minWidth: 180,
            background: terminalColors.bg,
            border: `1px solid ${terminalColors.line}`,
            borderRadius: 12,
            boxShadow: '0 14px 34px -12px rgba(11,15,20,.45)',
            padding: 6,
            zIndex: 41,
            fontFamily: terminalFonts.sans,
          }}
        >
          {section.children?.map((child) => (
            <button
              key={child.navId}
              type="button"
              onClick={() => {
                setOpen(false)
                onNavigate?.(child.path, child.navId)
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '9px 10px',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                background: 'transparent',
                fontFamily: terminalFonts.sans,
                fontSize: 13,
                fontWeight: 500,
                color: terminalColors.ink2,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = terminalColors.panel
                e.currentTarget.style.color = terminalColors.ink
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = terminalColors.ink2
              }}
            >
              {child.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function TopNav({
  activeId,
  onNavigate,
  searchPlaceholder = 'Search markets, tokens…',
  onSearchClick,
  chain,
  onChainClick,
  wallet,
  onConnectWallet,
  onWalletClick,
  actions,
}: TopNavProps): JSX.Element {
  const settingsActive = activeId === 'settings'
  return (
    <div
      style={{
        position: 'relative',
        height: 64,
        boxSizing: 'border-box',
        background: terminalColors.bgApp,
        borderBottom: `1px solid ${terminalColors.line2}`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 var(--tm-gutter)',
        fontFamily: terminalFonts.sans,
      }}
    >
      {/* Logo → landing */}
      <span
        role="link"
        tabIndex={0}
        aria-label="HookSwap home"
        title="Home"
        onClick={() => onNavigate?.('/', 'landing' as TerminalNavId)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onNavigate?.('/', 'landing' as TerminalNavId)
          }
        }}
        style={{ cursor: 'pointer', display: 'inline-flex', flexShrink: 0 }}
      >
        <HookLogo size={26} textSize="18px" />
      </span>

      {/* Nav items */}
      <nav style={{ display: 'flex', alignItems: 'stretch', gap: 15, height: 64, flexShrink: 0 }} aria-label="Primary">
        {NAV_SECTIONS.map((section) => (
          <NavItem
            key={section.label}
            section={section}
            active={section.activeIds.some((id) => id === activeId)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Flexible search — grows to fill, shrinks FIRST so the bar never overflows. */}
      <button
        type="button"
        onClick={onSearchClick}
        style={{ ...FIELD_BASE, gap: 9, height: 36, padding: '0 13px', flex: '1 1 auto', minWidth: 0, maxWidth: 300, cursor: 'text' }}
      >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={terminalColors.faint} strokeWidth={2} aria-hidden="true">
            <circle cx={11} cy={11} r={7} />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <span style={{ fontFamily: terminalFonts.sans, fontSize: 12.5, color: terminalColors.faint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {searchPlaceholder}
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: terminalFonts.mono,
              fontSize: 10.5,
              color: terminalColors.faint,
              background: terminalColors.bgApp,
              border: `1px solid ${terminalColors.line}`,
              padding: '2px 6px',
              borderRadius: 5,
              flexShrink: 0,
            }}
          >
            ⌘K
          </span>
        </button>

        {/* Right controls — fixed, never shrink */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Chain chip */}
        <button
          type="button"
          onClick={onChainClick}
          style={{ ...FIELD_BASE, gap: 7, height: 36, padding: '0 12px', cursor: 'pointer' }}
        >
          {chain?.chainId !== undefined ? (
            <ChainLogo chainId={chain.chainId} size={16} />
          ) : (
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: chain?.dotBackground ?? terminalTokenGradients.eth }} />
          )}
          <span style={{ fontFamily: terminalFonts.sans, fontSize: 12.5, fontWeight: 600, color: terminalColors.ink, whiteSpace: 'nowrap' }}>
            {chain?.name ?? 'Network'}
          </span>
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={terminalColors.faint} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {/* Settings gear */}
        <button
          type="button"
          aria-label="Settings"
          title="Settings"
          onClick={() => onNavigate?.('/terminal/settings', 'settings')}
          style={{
            ...FIELD_BASE,
            justifyContent: 'center',
            width: 36,
            height: 36,
            padding: 0,
            cursor: 'pointer',
            background: settingsActive ? terminalColors.bg : terminalColors.panel,
          }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke={settingsActive ? terminalColors.ink : terminalColors.ink2}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx={12} cy={12} r={3} />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* Wallet / connect */}
        {wallet ? (
          <button
            type="button"
            onClick={onWalletClick}
            style={{
              ...FIELD_BASE,
              gap: 7,
              height: 36,
              padding: '0 12px 0 7px',
              fontFamily: terminalFonts.mono,
              fontSize: 12.5,
              fontWeight: 500,
              color: terminalColors.ink,
              cursor: 'pointer',
            }}
          >
            <span style={{ width: 18, height: 18, borderRadius: 6, background: terminalTokenGradients.walletAvatar, flexShrink: 0 }} />
            {wallet.addressShort}
          </button>
        ) : (
          <button
            type="button"
            onClick={onConnectWallet}
            style={{
              height: 36,
              padding: '0 16px',
              borderRadius: 10,
              border: 'none',
              background: terminalColors.brandGreen,
              color: terminalColors.btnInk,
              fontFamily: terminalFonts.mono,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: `0 0 18px -6px ${terminalColors.brandGreen}`,
            }}
          >
            Connect
          </button>
        )}
      </div>

      {/* Overlay actions (e.g. chain switcher menu) — anchored to this bar. */}
      {actions}
    </div>
  )
}
