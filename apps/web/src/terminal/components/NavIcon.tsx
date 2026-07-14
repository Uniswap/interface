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
    case 'limit':
      // Limit order — a horizontal price line with a set marker.
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8h13M3 16h8" />
          <circle cx={18} cy={8} r={2.5} />
          <circle cx={13} cy={16} r={2.5} />
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
    case 'positions':
      // Liquidity positions — stacked layers.
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l8 4.5-8 4.5-8-4.5L12 3z" />
          <path d="M4 12l8 4.5 8-4.5M4 16.5L12 21l8-4.5" />
        </svg>
      )
    case 'locker':
      // Locker — a padlock (locked shackle + body).
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <rect x={4} y={10.5} width={16} height={10} rx={2.5} />
          <path d="M8 10.5V7a4 4 0 018 0v3.5" />
        </svg>
      )
    case 'buy':
      // Fiat on-ramp — a payment card.
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <rect x={2.5} y={5} width={19} height={14} rx={2.5} />
          <path d="M2.5 9.5h19M6 15h4" />
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
    case 'leaderboard':
      // Trading leaderboard — a trophy.
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z" />
          <path d="M17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3" />
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
    case 'referral':
      // Referrals — a gift box (share / earn).
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <rect x={3} y={8} width={18} height={4} rx={1} />
          <path d="M5 12v8h14v-8M12 8v12M12 8S10.5 4 8 4a2 2 0 000 4h4zM12 8s1.5-4 4-4a2 2 0 010 4h-4z" />
        </svg>
      )
    case 'launchpad':
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
          <path d="M12 15l-3-3a22 22 0 014-9 9.5 9.5 0 018 8 22 22 0 01-9 4z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
      )
    case 'x':
      // X (Twitter) wordmark — fill, not stroke.
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={stroke} stroke="none">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
        </svg>
      )
    case 'telegram':
      // Telegram paper plane — fill.
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={stroke} stroke="none">
          <path d="M21.94 4.76l-3.02 14.24c-.23 1.01-.83 1.26-1.68.78l-4.64-3.42-2.24 2.15c-.25.25-.46.46-.94.46l.33-4.73L18.36 6.2c.37-.33-.08-.51-.58-.18L6.16 13.13l-4.66-1.46c-1.01-.32-1.03-1.01.21-1.5L20.63 3.3c.84-.31 1.58.2 1.31 1.46z" />
        </svg>
      )
    case 'github':
      // GitHub mark — fill.
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={stroke} stroke="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.68-.22.68-.48v-1.69c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z"
          />
        </svg>
      )
    case 'multisender':
      // Multisender — one source fanning out to many recipients.
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <circle cx={5} cy={12} r={2.5} />
          <circle cx={19} cy={5} r={2} />
          <circle cx={19} cy={12} r={2} />
          <circle cx={19} cy={19} r={2} />
          <path d="M7.3 11l9.7-5.4M7.5 12h9.5M7.3 13l9.7 5.4" />
        </svg>
      )
    case 'token':
      // Create token — a coin with a "+" (mint a new fixed-supply ERC-20).
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <circle cx={12} cy={12} r={9} />
          <path d="M12 8v8M8 12h8" />
        </svg>
      )
    case 'vesting':
      // Vesting — an hourglass: tokens unlocking over time on a cliff + linear curve.
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12M6 21h12" />
          <path d="M7.5 3v3.2c0 1.1.5 2.1 1.4 2.8L12 12l-3.1 3c-.9.7-1.4 1.7-1.4 2.8V21" />
          <path d="M16.5 3v3.2c0 1.1-.5 2.1-1.4 2.8L12 12l3.1 3c.9.7 1.4 1.7 1.4 2.8V21" />
        </svg>
      )
    case 'farms':
      // Farms (staking) — a growing sprout: stake seeds, harvest rewards over time.
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21v-9" />
          <path d="M12 12C12 8 9 5 4 5c0 4 3 7 8 7z" />
          <path d="M12 14c0-3.5 3-6 8-6 0 3.5-3 6-8 6z" />
        </svg>
      )
    case 'airdrop':
      // Airdrop — a parachute dropping tokens to many recipients.
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 0 1 18 0" />
          <path d="M3 12l4.5 4M21 12l-4.5 4M12 12l-2 4M12 12l2 4" />
          <path d="M10 16h4v3a2 2 0 0 1-4 0z" />
        </svg>
      )
    case 'widget':
      // Embeddable widget builder — a frame with an inset panel.
      return (
        <svg {...common} strokeLinecap="round" strokeLinejoin="round">
          <rect x={3} y={4} width={18} height={16} rx={2} />
          <rect x={7} y={9} width={10} height={7} rx={1} />
        </svg>
      )
    default:
      return <svg {...common} />
  }
}
