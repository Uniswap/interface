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
  | 'portfolio' // B5
  | 'market-detail' // B6
  | 'confirm-swap' // B8 (modal)
  | 'connect-wallet' // B9 (modal)
  | 'analytics' // B10
  | 'command-palette' // B11 (modal)
  | 'settings' // B12
  | 'notifications' // B13

export type TerminalNavIcon = 'swap' | 'markets' | 'pools' | 'portfolio' | 'activity' | 'analytics' | 'settings' | 'docs'

/** External documentation site (opens in a new tab; not an in-app route). */
export const HOOKSWAP_DOCS_URL = 'https://hookswap.xyz/docs'

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
  id: TerminalScreenId | 'docs'
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
  { id: 'markets', label: 'Markets', icon: 'markets', path: `${TERMINAL_BASE}/markets` },
  { id: 'create-position', label: 'Pools', icon: 'pools', path: `${TERMINAL_BASE}/pools/new` },
  { id: 'analytics', label: 'Analytics', icon: 'analytics', path: `${TERMINAL_BASE}/analytics` },
]

/** ACCOUNT section — surfaced in the rail, in order. */
export const terminalAccountNav: TerminalNavItem[] = [
  { id: 'portfolio', label: 'Portfolio', icon: 'portfolio', path: `${TERMINAL_BASE}/portfolio` },
  { id: 'notifications', label: 'Activity', icon: 'activity', path: `${TERMINAL_BASE}/activity` },
]

/**
 * MORE section — surfaced in the rail below ACCOUNT. Settings is an in-app route;
 * Docs is an external link (opens hookswap.xyz/docs in a new tab).
 */
export const terminalResourcesNav: TerminalNavItem[] = [
  { id: 'settings', label: 'Settings', icon: 'settings', path: `${TERMINAL_BASE}/settings` },
  { id: 'docs', label: 'Docs', icon: 'docs', path: HOOKSWAP_DOCS_URL, externalHref: HOOKSWAP_DOCS_URL },
]
