import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'

/** Notification categories from the B13 feed. */
export type NotificationCategory = 'fees' | 'range' | 'swap' | 'alert' | 'governance'

export interface NotificationBadgeStyle {
  label: string
  color: string
  background: string
}

/**
 * Category tile styles, verbatim from the B13 prototype `notifications` data.
 * `range` (#C4712A), `alert` bg (#EAF2FE) and `governance` bg (#F0ECFF) are
 * prototype-only values not present in tokens.ts (see TERMINAL-DESIGN.md §6).
 */
export const notificationCategoryBadges: Record<NotificationCategory, NotificationBadgeStyle> = {
  fees: { label: 'FEES', color: terminalColors.greenDeep, background: terminalColors.greenBg },
  range: { label: 'RANGE', color: terminalColors.warn, background: terminalColors.warnBg },
  swap: { label: 'SWAP', color: terminalColors.ink2, background: terminalColors.panel2 },
  alert: { label: 'ALERT', color: terminalColors.accentBlue, background: 'rgba(46,124,246,0.14)' },
  governance: { label: 'GOV', color: terminalColors.accentPurple, background: 'rgba(138,107,255,0.16)' },
}

export interface NotificationAction {
  /** Contextual action, e.g. Collect / Rebalance / Review / Vote. */
  label: string
  onClick: () => void
}

export interface NotificationRowProps {
  /** Unread → 7px brand-green dot; read → the dot slot stays (transparent) so rows align. */
  unread: boolean
  category: NotificationCategory
  /** Overrides the tile text (defaults to the category label, e.g. "FEES"). */
  badgeLabel?: string
  title: string
  /** Secondary line, e.g. "ETH / USDC position earned $41.20". */
  detail: string
  /** Pre-formatted relative time, e.g. "2m ago". Rendered mono `#B0B7C0`. */
  timestamp: string
  /** Only rendered when the notification has a real action. */
  action?: NotificationAction
  /** Row click (e.g. open the related screen). */
  onClick?: () => void
  /** Hairline bottom divider (`1px solid #F4F6F8`). Default true, per the B13 feed card. */
  divider?: boolean
}

/**
 * Notification feed row — pixel-perfect to B13: unread dot, 38×38 category tile
 * (mono 9px/600 label on a tinted background), 14px/600 title + 12.5px muted
 * detail, mono 11px timestamp, and an outline action button shown only when an
 * action exists.
 */
export function NotificationRow({
  unread,
  category,
  badgeLabel,
  title,
  detail,
  timestamp,
  action,
  onClick,
  divider = true,
}: NotificationRowProps): JSX.Element {
  const badge = notificationCategoryBadges[category]

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e): void => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '15px 18px',
        borderBottom: divider ? `1px solid ${terminalColors.line3}` : undefined,
        fontFamily: terminalFonts.sans,
        cursor: onClick ? 'pointer' : undefined,
        background: terminalColors.bg,
      }}
    >
      {/* Unread dot */}
      <span
        aria-label={unread ? 'Unread' : undefined}
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: unread ? terminalColors.brandGreen : 'transparent',
          flexShrink: 0,
        }}
      />

      {/* Category tile */}
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: badge.background,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: terminalFonts.mono,
            fontSize: 9,
            fontWeight: 600,
            color: badge.color,
            textTransform: 'uppercase',
          }}
        >
          {badgeLabel ?? badge.label}
        </span>
      </span>

      {/* Title + detail */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: terminalColors.ink }}>{title}</div>
        <div style={{ fontSize: 12.5, color: terminalColors.ink3Alt, marginTop: 2 }}>{detail}</div>
      </div>

      {/* Timestamp (mono) */}
      <span
        style={{
          fontFamily: terminalFonts.mono,
          fontSize: 11,
          color: terminalColors.faint,
          whiteSpace: 'nowrap',
        }}
      >
        {timestamp}
      </span>

      {/* Contextual action — only when it exists */}
      {action ? (
        <button
          type="button"
          onClick={(e): void => {
            e.stopPropagation()
            action.onClick()
          }}
          style={{
            fontFamily: terminalFonts.sans,
            fontSize: 12,
            fontWeight: 600,
            color: terminalColors.ink,
            background: terminalColors.bg,
            border: `1px solid ${terminalColors.line}`,
            padding: '7px 14px',
            borderRadius: 9,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {action.label}
        </button>
      ) : null}
    </div>
  )
}
