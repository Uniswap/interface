import { CSSProperties } from 'react'
import { HookLogo } from '~/terminal/components/HookLogo'
import { NavIcon } from '~/terminal/components/NavIcon'
import {
  terminalAccountNav,
  terminalTradeNav,
  TerminalNavItem,
  TerminalScreenId,
} from '~/terminal/config/screens'
import { terminalColors, terminalFonts, terminalTokenGradients } from '~/terminal/theme/tokens'

/** Live "Hooks live" mini stat. `undefined` while loading. */
export interface HooksLiveStat {
  count: number
  deltaThisWeek: number
}

/** Connected wallet summary. `undefined` = disconnected (show connect affordance). */
export interface WalletSummary {
  /** Truncated address, e.g. "0x8f…3aE2". Rendered mono. */
  addressShort: string
  /** Live portfolio total, pre-formatted, e.g. "$48,210.55". Rendered mono. */
  portfolioUsdLabel: string
}

export interface LeftRailProps {
  /** Currently active screen; drives the active pill + green bar. */
  activeId?: TerminalScreenId
  /** Route handler (wire to react-router navigate). */
  onNavigate?: (path: string, id: TerminalScreenId) => void
  /** Live hooks-live stat. Omit to render the loading skeleton. */
  hooksLive?: HooksLiveStat
  /** Connected wallet. Omit to render the "Connect wallet" chip. */
  wallet?: WalletSummary
  /** Handler for the wallet chip when disconnected. */
  onConnectWallet?: () => void
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
  onNavigate,
}: {
  item: TerminalNavItem
  active: boolean
  onNavigate?: LeftRailProps['onNavigate']
}): JSX.Element {
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => onNavigate?.(item.path, item.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onNavigate?.(item.path, item.id)
        }
      }}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '9px 10px 9px 12px',
        borderRadius: 10,
        cursor: 'pointer',
        background: active ? terminalColors.bg : 'transparent',
        boxShadow: active ? '0 1px 2px rgba(11,15,20,.05)' : undefined,
      }}
    >
      {active ? (
        <span
          style={{
            position: 'absolute',
            left: -14,
            top: 9,
            bottom: 9,
            width: 3,
            borderRadius: '0 3px 3px 0',
            background: terminalColors.brandGreen,
          }}
        />
      ) : null}
      <NavIcon name={item.icon} stroke={active ? terminalColors.ink : terminalColors.railIconInactive} />
      <span
        style={{
          fontSize: 14,
          fontWeight: active ? 600 : 500,
          color: active ? terminalColors.ink : terminalColors.ink2,
        }}
      >
        {item.label}
      </span>
    </div>
  )
}

/**
 * Fixed 226px left rail — pixel-perfect from design/NavRailB.dc.html.
 * Top→bottom: logo, TRADE section, ACCOUNT section, "Hooks live" mini stat,
 * dark wallet chip. Data (hooks-live, wallet) is injected live; omitted data
 * renders loading / connect states (no hardcoded fallback values).
 */
export function LeftRail({
  activeId,
  onNavigate,
  hooksLive,
  wallet,
  onConnectWallet,
}: LeftRailProps): JSX.Element {
  const isActive = (item: TerminalNavItem): boolean => item.id === activeId

  return (
    <div
      style={{
        width: 226,
        alignSelf: 'stretch',
        boxSizing: 'border-box',
        background: terminalColors.panel,
        borderRight: `1px solid ${terminalColors.line}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 14px',
        fontFamily: terminalFonts.sans,
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '2px 8px 22px' }}>
        <HookLogo size={25} textSize="18px" />
      </div>

      <div style={{ ...SECTION_LABEL, padding: '0 10px 8px' }}>TRADE</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {terminalTradeNav.map((item) => (
          <NavRow key={item.id} item={item} active={isActive(item)} onNavigate={onNavigate} />
        ))}
      </div>

      <div style={{ ...SECTION_LABEL, padding: '20px 10px 8px' }}>ACCOUNT</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {terminalAccountNav.map((item) => (
          <NavRow key={item.id} item={item} active={isActive(item)} onNavigate={onNavigate} />
        ))}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Hooks-live mini stat card */}
        <div
          style={{
            background: terminalColors.bg,
            border: `1px solid ${terminalColors.line}`,
            borderRadius: 12,
            padding: '12px 13px',
          }}
        >
          <div style={{ fontSize: 11, color: terminalColors.ink3Alt, marginBottom: 4 }}>Hooks live</div>
          {hooksLive ? (
            <>
              <div
                style={{
                  fontFamily: terminalFonts.mono,
                  fontSize: 19,
                  fontWeight: 600,
                  color: terminalColors.ink,
                  letterSpacing: '-0.02em',
                }}
              >
                {hooksLive.count.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: terminalColors.greenUp, fontWeight: 600, marginTop: 2 }}>
                {hooksLive.deltaThisWeek >= 0 ? '+' : ''}
                {hooksLive.deltaThisWeek.toLocaleString()} this week
              </div>
            </>
          ) : (
            // loading skeleton
            <div
              aria-busy="true"
              style={{ height: 19, width: 56, borderRadius: 4, background: terminalColors.line2, marginTop: 2 }}
            />
          )}
        </div>

        {/* Wallet chip (dark) */}
        <div
          role="button"
          tabIndex={0}
          onClick={wallet ? undefined : onConnectWallet}
          onKeyDown={(e) => {
            if (!wallet && (e.key === 'Enter' || e.key === ' ')) {
              onConnectWallet?.()
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            background: terminalColors.ink,
            borderRadius: 12,
            padding: '9px 10px',
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
        </div>
      </div>
    </div>
  )
}
