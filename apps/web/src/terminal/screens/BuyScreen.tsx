/**
 * HookSwap Terminal — Buy (native-framed fiat on-ramp screen).
 *
 * Replaces the legacy Uniswap `/buy` page inside the Terminal shell. The buy
 * experience is a fiat on-ramp integration — it drives real third-party ramp
 * providers (aggregated quotes via the FiatOnRamp queries, the
 * `ChooseProviderModal` provider hand-off, country / currency selection). That
 * provider flow MUST keep working, so this screen uses the SAFE approach: it
 * renders the REAL, working `BuyForm` (the exact component the legacy `/buy` tab
 * mounts, in ON_RAMP direction) inside Terminal chrome (Atlas content header +
 * centered card frame) — no reimplementation of the provider integration.
 *
 * `BuyForm` is fully self-contained: it mounts its own `BuyFormContextProvider`
 * and reads only app-wide providers (localization, accounts, fiat currency, URL
 * context) that are already mounted on Terminal routes. It needs no swap /
 * multichain / limit context. The form is built from Tamagui `ui/src` primitives
 * whose tokens the Atlas reskin already remaps, so it inherits the native
 * Terminal look without a rewrite.
 *
 * Honest states: the framed `BuyForm` renders its own real states — a connect /
 * continue button (`BuyFormButton`), live/failed quote errors, unsupported-token
 * and provider-connection modals. No fabricated amounts or providers.
 */
import { RampDirection } from 'uniswap/src/features/fiatOnRamp/types'
import { BuyForm } from '~/pages/Swap/Buy/BuyForm'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'

const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

/** Fixed width of the framed buy module — matches the legacy swap module (480px). */
const MODULE_WIDTH = 480

/**
 * Buy screen. Frames the real on-ramp `BuyForm` (ON_RAMP direction) in Terminal
 * chrome. The provider / quote flow is the app's real fiat-on-ramp pipeline,
 * untouched.
 */
export function BuyScreen(): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 640 }}>
      {/* Content header — Atlas chrome, matches other Terminal screens. */}
      <div
        style={{
          height: 52,
          flexShrink: 0,
          borderBottom: `1px solid ${terminalColors.line2}`,
          background: terminalColors.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 22px',
        }}
      >
        <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, color: terminalColors.ink }}>Buy</span>
        <span style={{ fontFamily: SANS, fontSize: 12, color: terminalColors.ink3Alt }}>
          Fund your wallet with fiat via an on-ramp provider
        </span>
      </div>

      {/* Centered framed form — content region is viewport − 226px rail; the
          fixed max-width column keeps it clear of horizontal overflow. */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          background: terminalColors.bgApp,
          overflowY: 'auto',
          display: 'flex',
          justifyContent: 'center',
          padding: '28px 22px 48px',
        }}
      >
        <div style={{ width: '100%', maxWidth: MODULE_WIDTH }}>
          <BuyForm rampDirection={RampDirection.ON_RAMP} />
        </div>
      </div>
    </div>
  )
}
