/**
 * Shared prop contract for the RefreshButton compat (INFRA-3489), which
 * replaced the legacy `ui/src` `RefreshButton`.
 *
 * The legacy surface is `onPress` / `isLoading` / `disabled`. The compat adds
 * one required prop, `tooltipLabel`: the legacy web leg resolves
 * `t('common.refresh')` itself, but mycelium carries no i18n runtime, so the
 * call site passes the localized string (the `TriggerButtonCompat.tooltipLabel`
 * mechanism). The addition is deliberately REQUIRED so a conversion swap that
 * forgets it fails the typecheck instead of silently shipping an unlabeled
 * tooltip.
 */
export interface RefreshButtonCompatProps {
  /** Callback executed when the refresh button is pressed (or the `R` shortcut fires). */
  onPress: () => void
  /** Whether a refresh is in progress: blocks presses and freezes the icon's hover color. */
  isLoading: boolean
  /** Blocks both the press handler and the `R` keyboard shortcut, and hides the button entirely. */
  disabled?: boolean
  /** Localized tooltip label — the legacy string is `t('common.refresh')`. */
  tooltipLabel: string
}

/** Legacy `RefreshButton.web.tsx` keyboard shortcut keys. */
export const REFRESH_SHORTCUT_KEYS: readonly string[] = ['r', 'R']

/** Legacy `RefreshButtonIcon.tsx` icon size (`<RefreshIcon size={16} />`). */
export const REFRESH_ICON_SIZE = 16
