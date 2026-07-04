/**
 * HookSwap Terminal — additive design/UI layer.
 *
 * Standalone, pixel-perfect implementation of the "Terminal" (column 1b) design
 * handoff. Self-contained tokens + shell so it mounts alongside the existing
 * Uniswap-fork UI without modifying the Tamagui theme.
 */

// Theme tokens (typed)
export * from '~/terminal/theme/tokens'

// Screen registry / nav config
export * from '~/terminal/config/screens'

// Shell components
export { HookLogo } from '~/terminal/components/HookLogo'
export type { HookLogoProps } from '~/terminal/components/HookLogo'
export { NavIcon } from '~/terminal/components/NavIcon'
export type { NavIconProps } from '~/terminal/components/NavIcon'
export { LeftRail } from '~/terminal/components/LeftRail'
export type { LeftRailProps, HooksLiveStat, WalletSummary } from '~/terminal/components/LeftRail'
export { TopBar } from '~/terminal/components/TopBar'
export type { TopBarProps, GasInfo, ChainInfo } from '~/terminal/components/TopBar'
export { TerminalShell } from '~/terminal/components/TerminalShell'
export type { TerminalShellProps } from '~/terminal/components/TerminalShell'
