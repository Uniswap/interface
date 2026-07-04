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

// Chrome (shell wired to live app data) + core-route page
export { TerminalChrome } from '~/terminal/TerminalApp'
export { default as TerminalSwapPage } from '~/terminal/TerminalSwapPage'

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

// Shared UI primitives
export { SparklineCell, trendColor, trendDirectionOf } from '~/terminal/components/SparklineCell'
export type { SparklineCellProps, TrendDirection } from '~/terminal/components/SparklineCell'
export { StatCard } from '~/terminal/components/StatCard'
export type { StatCardProps, StatCardSize, StatDelta } from '~/terminal/components/StatCard'
export { HookBadge, NoHookBadge, hookCategoryColors } from '~/terminal/components/HookBadge'
export type { HookBadgeProps, HookBadgeColors, HookCategory } from '~/terminal/components/HookBadge'
export { DataTable } from '~/terminal/components/DataTable'
export type {
  DataTableAlign,
  DataTableColumn,
  DataTableProps,
  DataTableSort,
  DataTableSortDirection,
} from '~/terminal/components/DataTable'
export { Modal } from '~/terminal/components/Modal'
export type { ModalProps } from '~/terminal/components/Modal'
export { NotificationRow, notificationCategoryBadges } from '~/terminal/components/NotificationRow'
export type {
  NotificationAction,
  NotificationBadgeStyle,
  NotificationCategory,
  NotificationRowProps,
} from '~/terminal/components/NotificationRow'
export { CommandPalette } from '~/terminal/components/CommandPalette'
export type {
  CommandPaletteActionItem,
  CommandPaletteChange,
  CommandPaletteGroup,
  CommandPaletteItem,
  CommandPaletteProps,
  CommandPaletteTab,
  CommandPaletteTokenItem,
} from '~/terminal/components/CommandPalette'
