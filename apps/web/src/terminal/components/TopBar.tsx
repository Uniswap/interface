import { ReactNode } from 'react'
import { ChainLogo } from '~/components/Logo/ChainLogo'
import { HookLogo } from '~/terminal/components/HookLogo'
import { terminalColors, terminalFonts, terminalTokenGradients } from '~/terminal/theme/tokens'

/** Live gas readout. `undefined` while loading. */
export interface GasInfo {
  /** Whole gwei value, rendered mono, e.g. 12. */
  gwei: number
}

/** Connected chain summary. */
export interface ChainInfo {
  name: string
  /** Chain id — renders the real chain logo when present. */
  chainId?: number
  /** Optional CSS background for the chain dot (gradient/colour) fallback. */
  dotBackground?: string
}

export interface TopBarProps {
  /** Placeholder text for the search field (opens the command palette). */
  searchPlaceholder?: string
  /** Open the command palette (⌘K). */
  onSearchClick?: () => void
  /** Live gas oracle value. Omit to render a skeleton. */
  gas?: GasInfo
  /** Connected chain. Omit to render a skeleton. */
  chain?: ChainInfo
  /** Chain selector click (open chain switcher). */
  onChainClick?: () => void
  /** Per-screen actions rendered at the far right (e.g. Save/Reset, Export). */
  actions?: ReactNode
  /** Connected wallet summary. Omit → render the green "Connect wallet" button. */
  wallet?: { addressShort: string }
  /** Click handler when disconnected (open the wallet drawer to connect). */
  onConnectWallet?: () => void
  /** Click handler when connected (toggle the account drawer — switch/disconnect). */
  onWalletClick?: () => void
  /** Mobile: open the nav drawer (renders a hamburger + logo on the left). */
  onMenuClick?: () => void
  /** True on narrow viewports — compact layout (hamburger, flexible search). */
  isMobile?: boolean
}

const FIELD_BASE = {
  display: 'flex',
  alignItems: 'center',
  background: terminalColors.panel,
  border: `1px solid ${terminalColors.line2}`,
  borderRadius: 9,
} as const

/**
 * Terminal top bar — height 52px, pixel-perfect from the B1 prototype
 * (design/HookSwap Redesign.dc.html). Left: 280px search field. Right: mono gas
 * pill, chain selector, per-screen actions. Gas/chain are live props with
 * loading skeletons (no hardcoded fallback values).
 */
export function TopBar({
  searchPlaceholder = 'Search markets, tokens…',
  onSearchClick,
  gas,
  chain,
  onChainClick,
  actions,
  wallet,
  onConnectWallet,
  onWalletClick,
}: TopBarProps): JSX.Element {
  return (
    <div
      style={{
        height: 52,
        boxSizing: 'border-box',
        borderBottom: `1px solid ${terminalColors.line2}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--tm-gutter)',
        background: terminalColors.bg,
        fontFamily: terminalFonts.sans,
      }}
    >
      {/* Search field */}
      <div
        role="button"
        tabIndex={0}
        onClick={onSearchClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onSearchClick?.()
          }
        }}
        style={{
          ...FIELD_BASE,
          gap: 7,
          flex: '1 1 auto',
          minWidth: 0,
          maxWidth: 280,
          marginRight: 10,
          height: 34,
          padding: '0 11px',
          color: terminalColors.ink3Alt,
          fontSize: 12.5,
          cursor: 'text',
          overflow: 'hidden',
        }}
      >
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke={terminalColors.ink3Alt}
          strokeWidth={2}
          style={{ flexShrink: 0 }}
        >
          <circle cx={11} cy={11} r={7} />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{searchPlaceholder}</span>
      </div>

      {/* Right cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
        {/* Gas pill (mono) — only shown when a real gwei reading is available;
            no live gas oracle for the custom chains yet, so hide rather than
            render a permanent empty "— gwei". */}
        {gas ? (
          <span
            style={{
              ...FIELD_BASE,
              gap: 6,
              height: 32,
              padding: '0 11px',
              fontSize: 12,
              fontFamily: terminalFonts.mono,
              color: terminalColors.ink2,
            }}
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={terminalColors.warn} strokeWidth={2}>
              <path d="M13 2L3 14h7l-1 8 10-12h-7z" />
            </svg>
            {gas.gwei} gwei
          </span>
        ) : null}

        {/* Chain selector */}
        <span
          role="button"
          tabIndex={0}
          onClick={onChainClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onChainClick?.()
            }
          }}
          style={{
            ...FIELD_BASE,
            gap: 7,
            height: 32,
            padding: '0 11px',
            fontSize: 12.5,
            fontWeight: 500,
            color: terminalColors.ink,
            cursor: 'pointer',
          }}
        >
          {chain?.chainId !== undefined ? (
            <ChainLogo chainId={chain.chainId} size={15} />
          ) : (
            <span
              style={{
                width: 13,
                height: 13,
                borderRadius: '50%',
                background: chain?.dotBackground ?? terminalTokenGradients.eth,
              }}
            />
          )}
          {chain?.name ?? '—'}
        </span>

        {/* Wallet / connect — reuses the app's real AccountDrawer (mounted by
            TerminalChrome). Disconnected → green Connect button; connected →
            an address pill that toggles the drawer (switch / disconnect). */}
        {wallet ? (
          <span
            role="button"
            tabIndex={0}
            onClick={onWalletClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onWalletClick?.()
              }
            }}
            style={{
              ...FIELD_BASE,
              gap: 7,
              height: 32,
              padding: '0 11px 0 6px',
              fontSize: 12.5,
              fontWeight: 500,
              fontFamily: terminalFonts.mono,
              color: terminalColors.ink,
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 6,
                background: terminalTokenGradients.walletAvatar,
                flexShrink: 0,
              }}
            />
            {wallet.addressShort}
          </span>
        ) : (
          <button
            type="button"
            onClick={onConnectWallet}
            style={{
              height: 32,
              padding: '0 14px',
              borderRadius: 9,
              border: 'none',
              background: terminalColors.brandGreen,
              color: terminalColors.btnInk,
              fontSize: 12.5,
              fontWeight: 600,
              fontFamily: terminalFonts.sans,
              cursor: 'pointer',
            }}
          >
            Connect wallet
          </button>
        )}

        {actions}
      </div>
    </div>
  )
}
