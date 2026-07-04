import { TerminalNavIcon } from '~/terminal/config/screens'

/**
 * Left-rail nav icons. Stroke SVGs copied verbatim from design/NavRailB.dc.html
 * (18×18, viewBox 0 0 24 24). Colour is driven by the caller's `stroke` prop
 * (ink when active, #8A92A0 when inactive).
 */
export interface NavIconProps {
  name: TerminalNavIcon
  stroke: string
  size?: number
}

export function NavIcon({ name, stroke, size = 18 }: NavIconProps): JSX.Element {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke,
    strokeWidth: 2,
  }

  switch (name) {
    case 'swap':
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 4v14M7 4L4 7M7 4l3 3M17 20V6M17 20l-3-3M17 20l3-3" />
        </svg>
      )
    case 'markets':
      return (
        <svg {...common} strokeLinecap="round">
          <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        </svg>
      )
    case 'pools':
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3s6 6.5 6 10.5A6 6 0 016 13.5C6 9.5 12 3 12 3z" />
        </svg>
      )
    case 'hooks':
      return (
        <svg {...common} strokeLinejoin="round">
          <path d="M12 2.5l8.2 4.75v9.5L12 21.5 3.8 16.75v-9.5z" />
        </svg>
      )
    case 'portfolio':
      return (
        <svg {...common} strokeLinejoin="round">
          <path d="M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5" />
          <circle cx={17} cy={14} r={1.4} fill={stroke} stroke="none" />
        </svg>
      )
    case 'activity':
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h4l3-8 4 16 3-8h4" />
        </svg>
      )
    default:
      return <svg {...common} />
  }
}
