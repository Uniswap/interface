import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'

/** The 5 hook categories used across the Terminal design (B1 marketplace, B3 hook column, B10). */
export type HookCategory = 'fees' | 'orders' | 'security' | 'yield' | 'governance'

export interface HookBadgeColors {
  color: string
  background: string
}

/**
 * Category accent colours, verbatim from the prototype `hk()`/`hkm()` styles.
 * Text colours are existing tokens (green-deep, accent-indigo, accent-pink,
 * accent-teal, accent-purple); the light background tints for orders/security/
 * yield/governance exist only in the prototype markup (see TERMINAL-DESIGN.md §6).
 */
export const hookCategoryColors: Record<HookCategory, HookBadgeColors> = {
  fees: { color: terminalColors.greenDeep, background: terminalColors.greenBg }, // #0AA85A on #E9FBEF
  orders: { color: terminalColors.accentIndigo, background: '#EEF1FF' }, // #5B6BFF
  security: { color: terminalColors.accentPink, background: '#FDEBF0' }, // #E0517A
  yield: { color: terminalColors.accentTeal, background: '#E4F8F6' }, // #12B0A8
  governance: { color: terminalColors.accentPurple, background: '#F0ECFF' }, // #8A6BFF
}

interface HookBadgeBaseProps {
  /**
   * `badge` = table hook pill (B3: mono 10.5px/500, 3×8 padding, radius 6).
   * `chip`  = marketplace category chip (B1: mono 10px/500, radius 5, uppercase label e.g. FEES).
   */
  variant?: 'badge' | 'chip'
  /** Native tooltip. */
  title?: string
}

interface HookBadgeEnabledProps extends HookBadgeBaseProps {
  disabled?: false
  /** Hook name, e.g. "Dyn Fee", "TWAMM" — or the category word for the chip variant. */
  label: string
  category: HookCategory
  /**
   * Per-hook accent override (prototype shows the "Limit" hook in warn orange
   * `#F0913A` on `#FFF1E9` even though its category is orders).
   */
  colors?: HookBadgeColors
}

interface HookBadgeDisabledProps extends HookBadgeBaseProps {
  /**
   * Hooks are a Uniswap v4-only feature and are GATED until v4 is deployed.
   * The disabled variant renders a muted "v4 coming soon" chip.
   */
  disabled: true
  label?: string
  category?: HookCategory
}

export type HookBadgeProps = HookBadgeEnabledProps | HookBadgeDisabledProps

/**
 * Hook category chip — pixel-perfect to the prototype hook pills: IBM Plex Mono,
 * category-tinted background, no wrap. The `disabled` variant is the v4-gated
 * "coming soon" state (muted `#8A94A3` on `#EEF1F4`).
 */
export function HookBadge(props: HookBadgeProps): JSX.Element {
  const { variant = 'badge', title } = props
  const isChip = variant === 'chip'

  const colors: HookBadgeColors = props.disabled
    ? { color: terminalColors.ink3, background: terminalColors.panel2Alt }
    : (props.colors ?? hookCategoryColors[props.category])

  const label = props.disabled ? (props.label ?? 'v4 coming soon') : props.label

  return (
    <span
      title={title ?? (props.disabled ? 'Hooks are a Uniswap v4 feature — coming soon' : undefined)}
      aria-disabled={props.disabled ? true : undefined}
      style={{
        fontFamily: terminalFonts.mono,
        fontSize: isChip ? 10 : 10.5,
        fontWeight: 500,
        color: colors.color,
        background: colors.background,
        padding: '3px 8px',
        borderRadius: isChip ? 5 : 6,
        whiteSpace: 'nowrap',
        textTransform: isChip ? 'uppercase' : undefined,
        display: 'inline-block',
      }}
    >
      {label}
    </span>
  )
}

/** The "no hook attached" placeholder used in table hook columns (mono em-dash, `#B0B7C0`). */
export function NoHookBadge(): JSX.Element {
  return (
    <span
      aria-label="No hook"
      style={{ fontFamily: terminalFonts.mono, fontSize: 10.5, color: terminalColors.faint }}
    >
      —
    </span>
  )
}
