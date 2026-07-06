import { SparklineCell, TrendDirection, trendColor } from '~/terminal/components/SparklineCell'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'

/** Delta readout, e.g. `{ label: '+3.1%', direction: 'up' }`. Pre-formatted — no math inside. */
export interface StatDelta {
  label: string
  direction: TrendDirection
}

/**
 * `md` = B10 analytics stat card (radius 11, padding 13×14, label 11px, value 18px).
 * `lg` = B13 KPI card (radius 12, padding 14×16, label 12px, value 22px).
 */
export type StatCardSize = 'md' | 'lg'

export interface StatCardProps {
  label: string
  /** Pre-formatted display value (e.g. "$4.24B"). Omit while loading to render the skeleton. */
  value?: string
  /** Value colour: default ink; `up`/`down` for signed values (B13 "Fees claimable" is green). */
  valueColor?: TrendDirection | 'ink'
  delta?: StatDelta
  /** Mini sparkline series. Bottom row (B10) or right-hand side (B13 activity card). */
  sparkline?: readonly number[]
  sparklineDirection?: TrendDirection
  /** `bottom` (B10: 46×18 next to the delta) or `right` (B13: 90×34 beside a 16px value). */
  sparklinePosition?: 'bottom' | 'right'
  size?: StatCardSize
  /** Force the loading skeleton (also shown while `value` is undefined). */
  loading?: boolean
  /** Error message — renders an em-dash value + 11px red message. */
  error?: string
  /**
   * Renders a clean "Coming soon" state (em-dash value + muted caption, no red)
   * for metrics that depend on the not-yet-live indexer/backend. Takes
   * precedence over `error`.
   */
  comingSoon?: boolean
}

const SIZE = {
  md: { radius: 11, padding: '13px 14px', label: 11, value: 18 },
  lg: { radius: 12, padding: '14px 16px', label: 12, value: 22 },
} as const

/**
 * Terminal stat card — label + big IBM Plex Mono value + delta + optional mini
 * sparkline, pixel-perfect to the B10 analytics stat cards and B13 KPI row:
 * white card, `1px solid #E6E9EE` border, muted `#98A0AC` label, mono 600 value
 * with `-0.02em` tracking, mono 11px delta coloured by direction.
 */
export function StatCard({
  label,
  value,
  valueColor = 'ink',
  delta,
  sparkline,
  sparklineDirection,
  sparklinePosition = 'bottom',
  size = 'md',
  loading = false,
  error,
  comingSoon = false,
}: StatCardProps): JSX.Element {
  const s = SIZE[size]
  // "Coming soon" wins over both value and error: the metric can't exist yet.
  const isLoading = !comingSoon && (loading || (value === undefined && !error))
  const isPlaceholder = comingSoon || Boolean(error)
  const resolvedValueColor = valueColor === 'ink' ? terminalColors.ink : trendColor(valueColor)
  const sideSparkline = sparklinePosition === 'right'

  const labelNode = <div style={{ fontSize: s.label, color: terminalColors.ink3Alt }}>{label}</div>

  const valueNode = isLoading ? (
    <div
      aria-busy="true"
      style={{
        height: s.value,
        width: 64,
        borderRadius: 4,
        background: terminalColors.line2,
        marginTop: 5,
      }}
    />
  ) : (
    <div
      style={{
        fontFamily: terminalFonts.mono,
        fontSize: sideSparkline ? 16 : s.value,
        fontWeight: 600,
        color: isPlaceholder ? terminalColors.ink3 : resolvedValueColor,
        marginTop: 5,
        letterSpacing: '-0.02em',
      }}
    >
      {isPlaceholder ? '—' : value}
    </div>
  )

  return (
    <div
      style={{
        border: `1px solid ${terminalColors.line}`,
        borderRadius: s.radius,
        background: terminalColors.bg,
        padding: s.padding,
        fontFamily: terminalFonts.sans,
        boxSizing: 'border-box',
        minWidth: 0,
        ...(sideSparkline
          ? { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }
          : null),
      }}
    >
      <div style={{ minWidth: 0 }}>
        {labelNode}
        {valueNode}
        {comingSoon ? (
          <div style={{ fontSize: 11, color: terminalColors.ink3Alt, marginTop: 4 }}>Coming soon</div>
        ) : error ? (
          <div style={{ fontSize: 11, color: terminalColors.redDown, marginTop: 4 }}>{error}</div>
        ) : null}
      </div>

      {sideSparkline ? (
        sparkline && !isLoading && !isPlaceholder ? (
          <SparklineCell data={sparkline} direction={sparklineDirection} width={90} height={34} strokeWidth={2.2} />
        ) : null
      ) : delta || sparkline ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 8,
          }}
        >
          {delta && !isLoading && !isPlaceholder ? (
            <span
              style={{
                fontFamily: terminalFonts.mono,
                fontSize: 11,
                color: trendColor(delta.direction),
              }}
            >
              {delta.label}
            </span>
          ) : (
            <span />
          )}
          {sparkline && !isLoading && !isPlaceholder ? (
            <SparklineCell data={sparkline} direction={sparklineDirection} width={46} height={18} strokeWidth={2.4} />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
