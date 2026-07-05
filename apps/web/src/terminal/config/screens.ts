/**
 * HookSwap Terminal — screen registry.
 *
 * The 13 Terminal screens (B1–B13). The left rail surfaces the six PRIMARY
 * navigable screens in two sections (TRADE / ACCOUNT) exactly as designed; the
 * remaining screens are reached contextually (detail pages, modals, analytics,
 * settings, notifications) and are still registered here so routing + the
 * command palette can address every screen.
 *
 * Routes are namespaced under `/terminal` so the Terminal layer mounts
 * additively without colliding with the existing app routes.
 */

export type TerminalScreenId =
  | 'landing' // B1
  | 'swap' // B2
  | 'markets' // B3
  | 'create-position' // B4
  | 'locker' // Tools — lock LP/tokens + v3 positions
  | 'referrals' // Account — referral codes + earnings (deployed referral router)
  | 'portfolio' // B5
  | 'market-detail' // B6
  | 'confirm-swap' // B8 (modal)
  | 'connect-wallet' // B9 (modal)
  | 'analytics' // B10
  | 'command-palette' // B11 (modal)
  | 'settings' // B12
  | 'notifications' // B13

export type TerminalNavIcon =
  | 'swap'
  | 'limit'
  | 'markets'
  | 'pools'
  | 'positions'
  | 'locker'
  | 'referral'
  | 'buy'
  | 'portfolio'
  | 'activity'
  | 'analytics'
  | 'settings'
  | 'docs'
  | 'launchpad'
  | 'x'
  | 'telegram'
  | 'github'

/**
 * Rail item ids that point at LEGACY (non-Terminal) routes that still render
 * their own pages (`/positions`, `/limit`, `/buy`). These are not B-numbered
 * Terminal screens, so they live outside `TerminalScreenId` but still drive the
 * rail's active pill via {@link TerminalNavId}.
 */
export type TerminalLegacyNavId = 'positions' | 'limit' | 'buy'

/** Any id a rail nav item / active pill can take (Terminal screens + legacy routes). */
export type TerminalNavId = TerminalScreenId | TerminalLegacyNavId

/** Official HookSwap / HookOS links. External items open in a new tab. */
export const HOOKSWAP_LINKS = {
  docs: 'https://docs.hookswap.org',
  launchpad: 'https://hookos.fun/atlas',
  x: 'https://x.com/hookosfun',
  telegram: 'https://t.me/HookOSPortal',
  telegramTrending: 'https://t.me/hookosdeploys',
  github: 'https://github.com/HooksOS',
} as const

/** External documentation site (opens in a new tab; not an in-app route). */
export const HOOKSWAP_DOCS_URL = HOOKSWAP_LINKS.docs

export interface TerminalScreen {
  id: TerminalScreenId
  code: string // B-number label
  title: string
  path: string
  /** Modal screens overlay another route rather than owning a page. */
  kind: 'page' | 'modal'
}

const TERMINAL_BASE = '/terminal'

export const terminalScreens: Record<TerminalScreenId, TerminalScreen> = {
  landing: { id: 'landing', code: 'B1', title: 'Landing', path: `${TERMINAL_BASE}`, kind: 'page' },
  swap: { id: 'swap', code: 'B2', title: 'Swap', path: `${TERMINAL_BASE}/swap`, kind: 'page' },
  markets: { id: 'markets', code: 'B3', title: 'Markets', path: `${TERMINAL_BASE}/markets`, kind: 'page' },
  'create-position': {
    id: 'create-position',
    code: 'B4',
    title: 'Create position',
    path: `${TERMINAL_BASE}/pools/new`,
    kind: 'page',
  },
  locker: { id: 'locker', code: 'LK', title: 'Locker', path: `${TERMINAL_BASE}/locker`, kind: 'page' },
  referrals: { id: 'referrals', code: 'RF', title: 'Referrals', path: `${TERMINAL_BASE}/referrals`, kind: 'page' },
  portfolio: { id: 'portfolio', code: 'B5', title: 'Portfolio', path: `${TERMINAL_BASE}/portfolio`, kind: 'page' },
  'market-detail': {
    id: 'market-detail',
    code: 'B6',
    title: 'Market detail',
    path: `${TERMINAL_BASE}/markets/:poolId`,
    kind: 'page',
  },
  'confirm-swap': {
    id: 'confirm-swap',
    code: 'B8',
    title: 'Confirm swap',
    path: `${TERMINAL_BASE}/swap`,
    kind: 'modal',
  },
  'connect-wallet': {
    id: 'connect-wallet',
    code: 'B9',
    title: 'Connect wallet',
    path: `${TERMINAL_BASE}`,
    kind: 'modal',
  },
  analytics: { id: 'analytics', code: 'B10', title: 'Analytics', path: `${TERMINAL_BASE}/analytics`, kind: 'page' },
  'command-palette': {
    id: 'command-palette',
    code: 'B11',
    title: 'Search',
    path: `${TERMINAL_BASE}`,
    kind: 'modal',
  },
  settings: { id: 'settings', code: 'B12', title: 'Settings', path: `${TERMINAL_BASE}/settings`, kind: 'page' },
  notifications: {
    id: 'notifications',
    code: 'B13',
    title: 'Notifications',
    path: `${TERMINAL_BASE}/notifications`,
    kind: 'page',
  },
}

export interface TerminalNavItem {
  id: TerminalNavId | 'docs'
  label: string
  icon: TerminalNavIcon
  path: string
  /** When set, the item is an external link opened in a new tab (not an in-app route). */
  externalHref?: string
}

/**
 * TRADE section — surfaced in the rail, in order.
 *
 * The Terminal is the primary experience on the CORE routes: Swap points at
 * `/swap` (Terminal-rendered). Screens not yet ported (Markets, Pools,
 * Portfolio, Activity) point at the equivalent LEGACY routes so navigation
 * keeps working; swap each path to its Terminal screen as it lands.
 */
export const terminalTradeNav: TerminalNavItem[] = [
  { id: 'swap', label: 'Swap', icon: 'swap', path: '/swap' },
  // Limit is NOT a separate rail item — it's a tab inside the Swap ticket
  // (Market / Limit) that routes to /terminal/limit. The route still exists.
  { id: 'markets', label: 'Markets', icon: 'markets', path: `${TERMINAL_BASE}/markets` },
  { id: 'create-position', label: 'Pools', icon: 'pools', path: `${TERMINAL_BASE}/pools/new` },
  // View existing liquidity positions — Terminal-native screen (v2/v3 only).
  { id: 'positions', label: 'Positions', icon: 'positions', path: `${TERMINAL_BASE}/positions` },
  // Lock LP/tokens + v3 positions (HookSwap locker contracts).
  { id: 'locker', label: 'Locker', icon: 'locker', path: `${TERMINAL_BASE}/locker` },
  { id: 'analytics', label: 'Analytics', icon: 'analytics', path: `${TERMINAL_BASE}/analytics` },
]

/** ACCOUNT section — surfaced in the rail, in order. */
export const terminalAccountNav: TerminalNavItem[] = [
  { id: 'portfolio', label: 'Portfolio', icon: 'portfolio', path: `${TERMINAL_BASE}/portfolio` },
  { id: 'notifications', label: 'Activity', icon: 'activity', path: `${TERMINAL_BASE}/activity` },
  // Referral codes + earnings (deployed referral router).
  { id: 'referrals', label: 'Referrals', icon: 'referral', path: `${TERMINAL_BASE}/referrals` },
  // Fiat on-ramp — Terminal-native screen (frames the real on-ramp Buy form).
  { id: 'buy', label: 'Buy', icon: 'buy', path: `${TERMINAL_BASE}/buy` },
]

/**
 * MORE section — surfaced in the rail below ACCOUNT. Settings is an in-app route;
 * Docs + Launchpad are external links (open in a new tab).
 */
export const terminalResourcesNav: TerminalNavItem[] = [
  { id: 'settings', label: 'Settings', icon: 'settings', path: `${TERMINAL_BASE}/settings` },
  { id: 'docs', label: 'Docs', icon: 'docs', path: HOOKSWAP_LINKS.docs, externalHref: HOOKSWAP_LINKS.docs },
  { id: 'docs', label: 'Launchpad', icon: 'launchpad', path: HOOKSWAP_LINKS.launchpad, externalHref: HOOKSWAP_LINKS.launchpad },
]

/**
 * COMMUNITY section — official HookSwap socials. All open in a new tab.
 */
export const terminalCommunityNav: TerminalNavItem[] = [
  { id: 'docs', label: 'X', icon: 'x', path: HOOKSWAP_LINKS.x, externalHref: HOOKSWAP_LINKS.x },
  { id: 'docs', label: 'Telegram', icon: 'telegram', path: HOOKSWAP_LINKS.telegram, externalHref: HOOKSWAP_LINKS.telegram },
  {
    id: 'docs',
    label: 'Telegram Trending',
    icon: 'telegram',
    path: HOOKSWAP_LINKS.telegramTrending,
    externalHref: HOOKSWAP_LINKS.telegramTrending,
  },
  { id: 'docs', label: 'GitHub', icon: 'github', path: HOOKSWAP_LINKS.github, externalHref: HOOKSWAP_LINKS.github },
]
