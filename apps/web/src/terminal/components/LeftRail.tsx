import { CSSProperties } from 'react'
import { HookLogo } from '~/terminal/components/HookLogo'
import { NavIcon } from '~/terminal/components/NavIcon'
import {
  terminalAccountNav,
  terminalCommunityNav,
  terminalResourcesNav,
  terminalTradeNav,
  TerminalNavId,
  TerminalNavItem,
} from '~/terminal/config/screens'
import { terminalColors, terminalFonts, terminalTokenGradients } from '~/terminal/theme/tokens'

/** Connected wallet summary. `undefined` = disconnected (show connect affordance). */
export interface WalletSummary {
  /** Truncated address, e.g. "0x8f…3aE2". Rendered mono. */
  addressShort: string
  /** Live portfolio total, pre-formatted, e.g. "$48,210.55". Rendered mono. */
  portfolioUsdLabel: string
}

export interface LeftRailProps {
  /** Currently active screen; drives the active pill + green bar. */
  activeId?: TerminalNavId
  /** Route handler (wire to react-router navigate). */
  onNavigate?: (path: string, id: TerminalNavId) => void
  /** Connected wallet. Omit to render the "Connect wallet" chip. */
  wallet?: WalletSummary
  /** Handler for the wallet chip when disconnected. */
  onConnectWallet?: () => void
  /** Collapsed = icon-only 64px rail. Expanded (default) = 226px with labels. */
  collapsed?: boolean
  /** Toggle collapse (rendered as a chevron button by the logo). */
  onToggleCollapse?: () => void
}

const SECTION_LABEL: CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: '0.09em',
  color: terminalColors.ink3Alt,
}

function NavRow({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: TerminalNavItem
  active: boolean
  collapsed?: boolean
  onNavigate?: LeftRailProps['onNavigate']
}): JSX.Element {
  const isExternal = Boolean(item.externalHref)
  const rowStyle: CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: 11,
    padding: collapsed ? '9px 0' : '9px 10px 9px 12px',
    borderRadius: 10,
    cursor: 'pointer',
    textDecoration: 'none',
    background: active ? terminalColors.bg : 'transparent',
    boxShadow: active ? '0 1px 2px rgba(11,15,20,.05)' : undefined,
  }
  const inner = (
    <>
      {active ? (
        <span
          style={{
            position: 'absolute',
            left: collapsed ? -10 : -14,
            top: 9,
            bottom: 9,
            width: 3,
            borderRadius: '0 3px 3px 0',
            background: terminalColors.brandGreen,
          }}
        />
      ) : null}
      <NavIcon name={item.icon} stroke={active ? terminalColors.ink : terminalColors.railIconInactive} />
      {collapsed ? null : (
        <>
          <span
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: active ? 600 : 500,
              color: active ? terminalColors.ink : terminalColors.ink2,
            }}
          >
            {item.label}
          </span>
          {isExternal ? (
            <span aria-hidden style={{ fontSize: 12, color: terminalColors.ink3Alt, lineHeight: 1 }}>
              ↗
            </span>
          ) : null}
        </>
      )}
    </>
  )

  // External items are real anchors (new tab); internal items route via react-router.
  // When collapsed, the label is the native tooltip so icons stay discoverable.
  if (isExternal) {
    return (
      <a
        href={item.externalHref}
        target="_blank"
        rel="noopener noreferrer"
        title={collapsed ? item.label : undefined}
        style={rowStyle}
      >
        {inner}
      </a>
    )
  }
  return (
    <div
      role="link"
      tabIndex={0}
      title={collapsed ? item.label : undefined}
      onClick={() => onNavigate?.(item.path, item.id as TerminalNavId)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onNavigate?.(item.path, item.id as TerminalNavId)
        }
      }}
      style={rowStyle}
    >
      {inner}
    </div>
  )
}

/**
 * Fixed 226px left rail — pixel-perfect from design/NavRailB.dc.html.
 * Top→bottom: logo, TRADE section, ACCOUNT section, dark wallet chip. Wallet data
 * is injected live; when disconnected the chip renders a "Connect wallet" state
 * (no hardcoded fallback values).
 */
/** Chevron toggle button for collapsing/expanding the rail. */
function CollapseToggle({ collapsed, onToggle }: { collapsed?: boolean; onToggle?: () => void }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
      title={collapsed ? 'Expand' : 'Collapse'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        flexShrink: 0,
        borderRadius: 8,
        border: `1px solid ${terminalColors.line}`,
        background: terminalColors.bg,
        color: terminalColors.ink2,
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {collapsed ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}
      </svg>
    </button>
  )
}

export function LeftRail({
  activeId,
  onNavigate,
  wallet,
  onConnectWallet,
  collapsed,
  onToggleCollapse,
}: LeftRailProps): JSX.Element {
  const isActive = (item: TerminalNavItem): boolean => item.id === activeId

  const sectionLabel = (label: string): JSX.Element | null =>
    collapsed ? (
      <div style={{ height: 1, background: terminalColors.line, margin: '16px 6px 8px' }} />
    ) : (
      <div style={{ ...SECTION_LABEL, padding: '20px 10px 8px' }}>{label}</div>
    )

  const renderNav = (items: TerminalNavItem[], keyByLabel = false): JSX.Element => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {items.map((item) => (
        <NavRow
          key={keyByLabel ? item.label : item.id}
          item={item}
          active={isActive(item)}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )

  return (
    <div
      style={{
        width: collapsed ? 68 : 226,
        alignSelf: 'stretch',
        boxSizing: 'border-box',
        background: terminalColors.panel,
        borderRight: `1px solid ${terminalColors.line}`,
        display: 'flex',
        flexDirection: 'column',
        padding: collapsed ? '20px 12px' : '20px 14px',
        fontFamily: terminalFonts.sans,
        flexShrink: 0,
        overflowY: 'auto',
        transition: 'width 0.15s ease',
      }}
    >
      {/* Logo + collapse toggle */}
      <div
        style={{
          display: 'flex',
          flexDirection: collapsed ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: collapsed ? 12 : 8,
          padding: collapsed ? '2px 0 20px' : '2px 4px 22px 8px',
        }}
      >
        <span
          role="link"
          tabIndex={0}
          aria-label="HookSwap home"
          title="Home"
          onClick={() => onNavigate?.('/', 'landing')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onNavigate?.('/', 'landing')
            }
          }}
          style={{ cursor: 'pointer', display: 'inline-flex' }}
        >
          <HookLogo size={25} textSize="18px" showText={!collapsed} />
        </span>
        <CollapseToggle collapsed={collapsed} onToggle={onToggleCollapse} />
      </div>

      {collapsed ? null : <div style={{ ...SECTION_LABEL, padding: '0 10px 8px' }}>TRADE</div>}
      {renderNav(terminalTradeNav)}

      {sectionLabel('ACCOUNT')}
      {renderNav(terminalAccountNav)}

      {sectionLabel('MORE')}
      {renderNav(terminalResourcesNav, true)}

      {sectionLabel('COMMUNITY')}
      {renderNav(terminalCommunityNav, true)}

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16 }}>
        {/* Wallet chip (dark) — avatar-only when collapsed. */}
        <div
          role="button"
          tabIndex={0}
          title={collapsed ? (wallet ? wallet.addressShort : 'Connect wallet') : undefined}
          onClick={wallet ? undefined : onConnectWallet}
          onKeyDown={(e) => {
            if (!wallet && (e.key === 'Enter' || e.key === ' ')) {
              onConnectWallet?.()
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 9,
            background: terminalColors.ink,
            borderRadius: 12,
            padding: collapsed ? '9px 0' : '9px 10px',
            color: '#fff',
            cursor: wallet ? 'default' : 'pointer',
          }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: terminalTokenGradients.walletAvatar,
              flexShrink: 0,
            }}
          />
          {collapsed ? null : (
            <div style={{ lineHeight: 1.25, minWidth: 0 }}>
              {wallet ? (
                <>
                  <div style={{ fontFamily: terminalFonts.mono, fontSize: 12.5, fontWeight: 500 }}>
                    {wallet.addressShort}
                  </div>
                  <div style={{ fontSize: 10.5, color: terminalColors.railWalletSub }}>{wallet.portfolioUsdLabel}</div>
                </>
              ) : (
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>Connect wallet</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
