/**
 * HookSwap Terminal — design tokens.
 *
 * Pixel-perfect extraction of the "Terminal" (column 1b) direction from the
 * design handoff (design_handoff_hookswap_terminal/README.md). Every value here
 * is copied EXACTLY from the spec — do not "improve" or round.
 *
 * This module is fully additive: it is a standalone, typed token object consumed
 * by the Terminal component layer via inline styles / CSS variables. It does NOT
 * mutate the existing Tamagui theme, so the live Uniswap-fork app is unaffected.
 *
 * The same values are mirrored as CSS custom properties in ./terminal.css
 * (prefixed `--tm-`) for consumers that prefer variables.
 */

/* ------------------------------------------------------------------ colors */

export const terminalColors = {
  // Text / ink  — DARK THEME (roles preserved; hexes flipped for a dark surface)
  ink: '#E7ECF2', // primary text / headings (was #0B0F14)
  ink2: '#9AA4B2', // secondary text (was #59626F)
  ink3: '#7C8698', // muted labels (primary) (was #8A94A3)
  ink3Alt: '#7C8698', // muted labels (alt used in rail section labels) (was #98A0AC)
  faint: '#5C6675', // axis labels, timestamps (was #B0B7C0)

  // Lines / dividers
  line: '#232B36', // card/frame borders (was #E6E9EE)
  line2: '#1C232D', // inner dividers / section rules (was #EFF1F4)
  line3: '#1A212B', // table row dividers (was #F4F6F8)

  // Surfaces
  bg: '#12181F', // cards, top bar, active pills (was #FFFFFF)
  bgApp: '#0B0F14', // main content / page background (was #FCFCFD)
  panel: '#0E141B', // inputs, rail background, inset fields / chart wells (was #F6F8FA)
  panel2: '#0E141B', // segmented-control track, chips (primary) (was #F0F3F6)
  panel2Alt: '#0E141B', // segmented-control track, chips (alt) (was #EEF1F4)

  // Brand green
  brandGreen: '#2FE07E', // primary buttons, active accent, "Swap" wordmark (kept)
  greenDeep: '#2FE07E', // green text/links — brightened for contrast on dark (was #0AA85A)
  greenUp: '#2FE07E', // positive values (was #12B866)
  greenBg: '#0B2418', // green badge/surface (was #E9FBEF)
  greenBorder: '#12502F', // green card border (was #C7F3D8)
  btnInk: '#0B0F14', // text on brand-green buttons — dark ink (was #08110A)

  // Red / negative
  redDown: '#EF4E4A', // negative values (kept)
  redBg: '#2A1214', // negative surface — dark red well (was #FDEBEA)

  // Warn
  warn: '#F0913A', // gas, out-of-range (kept; legible amber on dark)
  warnBg: '#2A1E10', // warn surface (primary) — dark amber well (was #FFF3E8)
  warnBgAlt: '#2A1E10', // warn surface (alt) (was #FFF1E9)

  // Accents (categories / token icons) — kept: saturated, legible on dark
  accentIndigo: '#5B6BFF', // ETH icon, TWAMM category
  accentBlue: '#2E7CF6', // USDC icon
  accentPurple: '#8A6BFF', // governance
  accentPink: '#E0517A', // security category
  accentTeal: '#12B0A8', // yield category

  // Rail-specific inactive icon (from NavRailB.dc.html)
  railIconInactive: '#7C8698', // inactive nav icon on dark rail (was #8A92A0)
  railWalletSub: '#7C8698', // wallet chip subtext (kept — chip was already dark)
} as const

export type TerminalColorToken = keyof typeof terminalColors

/**
 * Placeholder token-logo gradients from the prototype. These are CSS gradient
 * circles used ONLY where a real token logo asset is not yet available; the
 * handoff mandates replacing them with real logos (token lists / CDN).
 */
export const terminalTokenGradients = {
  eth: 'linear-gradient(135deg,#8A92FF,#5B6BFF)',
  usdc: 'linear-gradient(135deg,#2E7CF6,#2563EB)',
  walletAvatar: 'linear-gradient(135deg,#2FE07E,#12B866)',
} as const

/* -------------------------------------------------------------- typography */

export const terminalFonts = {
  /** Display / headings / logo wordmark. */
  display: "'Space Grotesk', sans-serif",
  /** UI / body. */
  sans: "'IBM Plex Sans', sans-serif",
  /** Numbers, prices, addresses, tickers, code, param values (hard rule). */
  mono: "'IBM Plex Mono', monospace",
} as const

/** Letter-spacing values used across the spec. */
export const terminalLetterSpacing = {
  displayTight: '-0.03em',
  display: '-0.02em',
  pillTight: '-0.01em',
  railSection: '0.09em', // uppercase section labels (TRADE / ACCOUNT)
} as const

/**
 * Representative type scale from README §Typography. `family` names the intended
 * font per role; `size`/`weight`/`ls` are px / numeric / letter-spacing.
 */
export const terminalType = {
  heroH1: { family: 'display', size: 50, weight: 600, ls: terminalLetterSpacing.display },
  sectionTitle: { family: 'display', size: 26, weight: 600, ls: terminalLetterSpacing.display },
  sectionTitleSm: { family: 'display', size: 22, weight: 600, ls: terminalLetterSpacing.display },
  cardTitle: { family: 'sans', size: 17, weight: 600, ls: '0' },
  cardTitleSm: { family: 'sans', size: 14, weight: 600, ls: '0' },
  body: { family: 'sans', size: 14, weight: 400, ls: '0' },
  bodyLg: { family: 'sans', size: 16, weight: 400, ls: '0' },
  bodySm: { family: 'sans', size: 13, weight: 400, ls: '0' },
  tableCell: { family: 'mono', size: 13, weight: 400, ls: '0' }, // 12.5–14
  kpiValue: { family: 'mono', size: 22, weight: 600, ls: terminalLetterSpacing.display }, // 18–28
  microLabel: { family: 'sans', size: 11, weight: 600, ls: '0' }, // 10.5–12
  railSectionLabel: { family: 'sans', size: 10.5, weight: 600, ls: terminalLetterSpacing.railSection },
} as const

export type TerminalTypeToken = keyof typeof terminalType

/* ----------------------------------------------------------------- shape */

/** Border radii (px unless the 999px pill / 50% circle). */
export const terminalRadii = {
  pill: 999,
  circle: '50%',
  buttonMin: 9,
  buttonMax: 15,
  inputMin: 9,
  inputMax: 13,
  cardMin: 11,
  cardMax: 18,
  screenFrame: 18,
  modalMin: 18,
  modalMax: 22,
  // Concrete values used verbatim in the nav/top-bar prototype:
  railItem: 10,
  railCard: 12,
  topBarField: 9,
} as const

export const terminalBorders = {
  card: `1px solid ${terminalColors.line}`, // 1px solid #E6E9EE
  innerDivider: `1px solid ${terminalColors.line2}`, // 1px solid #EFF1F4
  rowDivider: `1px solid ${terminalColors.line3}`, // 1px solid #F4F6F8
  greenCard: `1px solid ${terminalColors.greenBorder}`,
} as const

export const terminalShadows = {
  screenFrame: '0 30px 60px -30px rgba(11,15,20,.22)',
  modal: '0 40px 90px -20px rgba(11,15,20,.5)',
  segmentedActive: '0 1px 2px rgba(11,15,20,.06)',
  railActiveItem: '0 1px 2px rgba(11,15,20,.05)',
  greenGlow: '0 0 8px #2FE07E', // connection dot glow (top bar)
} as const

/** Modal scrim colour (B8/B9/B11). */
export const terminalScrim = 'rgba(0,0,0,.6)'

/* --------------------------------------------------------------- layout */

export const terminalLayout = {
  frameWidth: 1360, // all Terminal screens are 1360px desktop frames
  railWidth: 226, // fixed left rail
  topBarHeight: 52, // Terminal top bar
  // Per-screen fixed columns (from README screen specs):
  swapMarketListWidth: 238, // B2 left market list
  swapTicketWidth: 326, // B2 right swap ticket
  createConfigWidth: 300, // B4 left config
  createDepositWidth: 300, // B4 right deposit
  marketDetailSideWidth: 330, // B6 right column
  hookDetailSideWidth: 340, // B7 right column
  confirmModalWidth: 424, // B8
  connectModalWidth: 400, // B9
  commandPaletteWidth: 640, // B11
  settingsNavWidth: 210, // B12 left settings nav
  contentPaddingMin: 16,
  contentPaddingMax: 26,
} as const

/* ---------------------------------------------------------- primitives */

/** Primary button (bg brand-green, ink text). */
export const terminalPrimaryButton = {
  background: terminalColors.brandGreen,
  color: terminalColors.btnInk,
  fontWeight: 600,
  fontFamily: terminalFonts.sans,
} as const

/** Green text link (#0AA85A, 600, trailing →). */
export const terminalGreenLink = {
  color: terminalColors.greenDeep,
  fontWeight: 600,
} as const

/** Category chip colour map (hook marketplace / badges). */
export const terminalCategoryColors: Record<string, string> = {
  Fees: terminalColors.greenUp,
  Orders: terminalColors.accentIndigo,
  TWAMM: terminalColors.accentIndigo,
  Security: terminalColors.accentPink,
  Yield: terminalColors.accentTeal,
  Governance: terminalColors.accentPurple,
}
