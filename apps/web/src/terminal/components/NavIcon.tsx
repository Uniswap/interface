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
    case 'analytics':
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 21H4a1 1 0 01-1-1V3" />
          <path d="M7 15l4-5 3 3 5-7" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <circle cx={12} cy={12} r={3} />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      )
    case 'docs':
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      )
    default:
      return <svg {...common} />
  }
}
