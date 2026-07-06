import { NavIcon } from '~/terminal/components/NavIcon'
import {
  terminalAccountNav,
  terminalTradeNav,
  TerminalNavId,
  TerminalNavItem,
} from '~/terminal/config/screens'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'

/**
 * Mobile bottom tab bar — the primary navigation on narrow viewports (the 226px
 * left rail is hidden < ~900px; see TerminalShell). Fixed to the bottom edge,
 * safe-area-padded so it clears the iOS home indicator. Surfaces the four most
 * important screens (Swap · Markets · Pools · Portfolio) plus a "More" tab that
 * opens the full-nav drawer (Positions, Locker, Analytics, Activity, Referrals,
 * Buy, Widget, Settings, Docs, socials).
 *
 * Items are pulled from the same `screens.ts` nav config the desktop rail uses, so
 * the two navigations never drift.
 */
export interface BottomTabBarProps {
  /** Active rail screen id (drives the highlighted tab). */
  activeId?: TerminalNavId
  /** Route handler (same signature as the rail). */
  onNavigate?: (path: string, id: TerminalNavId) => void
  /** Open the full-nav drawer (the "More" tab). */
  onMore?: () => void
  /** True while the drawer is open (highlights the "More" tab). */
  moreActive?: boolean
}

/** Pull a single nav item out of a config list by id (kept in sync with screens.ts). */
function pick(items: TerminalNavItem[], id: TerminalNavId): TerminalNavItem | undefined {
  return items.find((item) => item.id === id)
}

/** The four primary tabs, sourced from the shared nav config. */
const PRIMARY_TABS: TerminalNavItem[] = [
  pick(terminalTradeNav, 'swap'),
  pick(terminalTradeNav, 'markets'),
  pick(terminalTradeNav, 'create-position'),
  pick(terminalAccountNav, 'portfolio'),
].filter((item): item is TerminalNavItem => item !== undefined)

/** Height of the tab row itself (excludes the safe-area inset added below it). */
export const BOTTOM_TAB_BAR_HEIGHT = 58

function TabButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active: boolean
  onClick: () => void
  children: React.ReactNode
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      style={{
        flex: 1,
        minWidth: 0,
        // 44px min tap target (Apple HIG) — the row is 58px tall.
        minHeight: 44,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: '6px 2px',
        color: active ? terminalColors.ink : terminalColors.railIconInactive,
      }}
    >
      {children}
      <span
        style={{
          fontFamily: terminalFonts.sans,
          fontSize: 10.5,
          fontWeight: active ? 600 : 500,
          color: active ? terminalColors.ink : terminalColors.ink3Alt,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </button>
  )
}

export function BottomTabBar({ activeId, onNavigate, onMore, moreActive }: BottomTabBarProps): JSX.Element {
  return (
    <nav
      aria-label="Primary"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 45,
        display: 'flex',
        alignItems: 'stretch',
        background: terminalColors.bg,
        borderTop: `1px solid ${terminalColors.line}`,
        // Clear the iPhone home indicator.
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -1px 2px rgba(11,15,20,.04)',
        fontFamily: terminalFonts.sans,
      }}
    >
      {PRIMARY_TABS.map((item) => {
        const active = item.id === activeId
        return (
          <TabButton
            key={item.id}
            label={item.label}
            active={active}
            onClick={() => onNavigate?.(item.path, item.id as TerminalNavId)}
          >
            <NavIcon
              name={item.icon}
              size={22}
              stroke={active ? terminalColors.ink : terminalColors.railIconInactive}
            />
          </TabButton>
        )
      })}
      <TabButton label="More" active={Boolean(moreActive)} onClick={() => onMore?.()}>
        <svg
          width={22}
          height={22}
          viewBox="0 0 24 24"
          fill="none"
          stroke={moreActive ? terminalColors.ink : terminalColors.railIconInactive}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </TabButton>
    </nav>
  )
}
