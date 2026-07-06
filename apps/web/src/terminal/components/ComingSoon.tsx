import { CSSProperties } from 'react'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'

export interface ComingSoonProps {
  /** Badge text. Default `COMING SOON` (rendered uppercase mono). */
  label?: string
  /** Muted one-liner under the badge. Default indexer copy. Pass `null` to omit. */
  subtext?: string | null
  /**
   * `panel` (default): centered badge + subtext, for empty tables / charts / big
   * panels that depend on the not-yet-live backend.
   * `inline`: a single centered line (badge + subtext) for thin strips (ticker,
   * movers, feed rows) where a full panel would be too tall.
   */
  variant?: 'panel' | 'inline'
  /** Min height for the `panel` variant — keeps a card/chart height stable. */
  minHeight?: number | string
  style?: CSSProperties
}

const DEFAULT_SUBTEXT = 'Live metrics arrive with the HookSwap indexer.'

/**
 * HookSwap Terminal "Coming soon" state.
 *
 * The honest pre-launch placeholder for data that requires the self-hosted
 * indexer / data backend (protocol TVL, 24h volume, top movers, analytics
 * series, markets, positions, activity …) which is not live yet. Rendered in
 * place of error / "failed to load" states so the app reads as intentional
 * rather than broken. Uses only the Terminal theme tokens — no red/error colour.
 */
export function ComingSoon({
  label = 'COMING SOON',
  subtext = DEFAULT_SUBTEXT,
  variant = 'panel',
  minHeight,
  style,
}: ComingSoonProps): JSX.Element {
  const badge = (
    <span
      style={{
        display: 'inline-block',
        fontFamily: terminalFonts.mono,
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        color: terminalColors.ink3,
        background: terminalColors.panel2,
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 999,
        padding: '4px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )

  if (variant === 'inline') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: terminalFonts.sans,
          fontSize: 12.5,
          color: terminalColors.ink3Alt,
          ...style,
        }}
      >
        {badge}
        {subtext ? <span>{subtext}</span> : null}
      </span>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        textAlign: 'center',
        padding: '28px 16px',
        minHeight,
        fontFamily: terminalFonts.sans,
        ...style,
      }}
    >
      {badge}
      {subtext ? (
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: terminalColors.ink3Alt, maxWidth: 320 }}>{subtext}</div>
      ) : null}
    </div>
  )
}
