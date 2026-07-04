import { terminalColors, terminalFonts, terminalLetterSpacing } from '~/terminal/theme/tokens'

/**
 * HookSwap logo — pointy-top hexagon outline (ink) with an open neon-green ring
 * (the "hook") inside. Wordmark "Hook" in ink + "Swap" in brand-green,
 * Space Grotesk 700. Reproduced as an SVG component per handoff (do not ship the
 * prototype HTML). Geometry copied verbatim from design/HookLogo.dc.html.
 */
export interface HookLogoProps {
  /** Glyph square size in px. Default 34 (logo preview default). */
  size?: number
  /** Show the "HookSwap" wordmark next to the glyph. */
  showText?: boolean
  /** Wordmark font-size, e.g. "22px". */
  textSize?: string
  /** Gap between glyph and wordmark. */
  gap?: string
  /** Neon-green ring + "Swap" colour. Defaults to brand-green. */
  green?: string
  /** Ink colour for hexagon + "Hook". */
  inkColor?: string
}

export function HookLogo({
  size = 34,
  showText = true,
  textSize = '22px',
  gap = '10px',
  green = terminalColors.brandGreen,
  inkColor = terminalColors.ink,
}: HookLogoProps): JSX.Element {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap, lineHeight: 1 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        style={{ display: 'block', overflow: 'visible' }}
        aria-hidden={!showText}
      >
        <path
          d="M24 3.5 L41.8 13.75 L41.8 34.25 L24 44.5 L6.2 34.25 L6.2 13.75 Z"
          fill="none"
          stroke={inkColor}
          strokeWidth={2.4}
          strokeLinejoin="round"
        />
        <circle
          cx={24}
          cy={25}
          r={7.2}
          fill="none"
          stroke={green}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeDasharray="33 13"
          transform="rotate(118 24 25)"
        />
      </svg>
      {showText ? (
        <span
          style={{
            fontFamily: terminalFonts.display,
            fontWeight: 700,
            letterSpacing: terminalLetterSpacing.display,
            fontSize: textSize,
            display: 'inline-flex',
          }}
        >
          <span style={{ color: inkColor }}>Hook</span>
          <span style={{ color: green }}>Swap</span>
        </span>
      ) : null}
    </span>
  )
}
