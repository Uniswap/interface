/**
 * HookSwap Terminal — Limit (native-framed limit-order screen).
 *
 * Replaces the legacy Uniswap `/limit` page inside the Terminal shell. The limit
 * experience is deeply coupled to the real order-signing pipeline — Permit2
 * allowance (`usePermit2Allowance`), the UniversalRouter spender, the
 * `useLimitOrderCallback` signing flow and the `ConfirmLimitOrderModal` review /
 * submit sequence. Rebuilding that natively would risk breaking a live
 * transactional flow, so this screen uses the SAFE approach: it renders the
 * REAL, working `LimitFormWrapper` (the exact component the legacy `/limit` tab
 * mounts) inside Terminal chrome (Atlas content header + centered card frame).
 *
 * The framed form is composed of Tamagui `ui/src` primitives whose theme tokens
 * the Atlas reskin already remaps (green accent, paper surfaces, Inter /
 * JetBrains Mono), so it inherits the native Terminal look without a rewrite.
 *
 * Provider stack mirrors the legacy `Swap` page's Limit tab EXACTLY (Multichain →
 * SwapTransactionSettings → SwapAndLimit → SwapFormStore), which is the same
 * proven stack `SwapScreen` mounts — so the form reads real chain/currency state
 * and its own effects default to a limit-supported chain (Mainnet).
 *
 * Honest states: the framed `LimitForm` renders its own real states — a "Connect
 * wallet" submit button when disconnected (opens the app's real AccountDrawer),
 * market-price loading, insufficient-funds / unsupported-chain / limit-price
 * errors, and the open-orders link. No fabricated quotes or amounts.
 *
 * HookSwap ships v2 + v3 only (no Uniswap v4 / hooks — LOCKED decision). Limit
 * orders on the app route through the UniversalRouter path already wired for the
 * supported chains; no hook UI is introduced here.
 */
import { useMemo, useState } from 'react'
import { USDC, nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SwapTransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/SwapTransactionSettingsStoreContextProvider'
import { useSwapPrefilledState } from 'uniswap/src/features/transactions/swap/form/hooks/useSwapPrefilledState'
import { SwapFormStoreContextProvider } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContextProvider'
import { currencyToAsset } from 'uniswap/src/features/transactions/swap/utils/asset'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapAndLimitContextProvider } from '~/features/Swap/state/SwapContext'
import { LimitFormWrapper } from '~/pages/Swap/Limit/LimitForm'
import { MultichainContextProvider } from '~/state/multichain/MultichainContext'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'

const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

/** Fixed width of the framed order module — matches the legacy swap module (480px). */
const MODULE_WIDTH = 480

/**
 * Limit screen. Mounts the legacy limit-order form's exact provider stack
 * (proven-working; identical to `SwapScreen` and the legacy `/limit` tab) and
 * frames the real `LimitFormWrapper` in Terminal chrome. Prefilled with a real
 * default pair on Mainnet (a limit-supported chain); the form's own effects
 * coerce to supported defaults and the user re-selects tokens via the real
 * currency selector.
 */
export function LimitScreen(): JSX.Element {
  const initialInputCurrency = useMemo(() => nativeOnChain(UniverseChainId.Mainnet), [])
  const initialOutputCurrency = USDC

  const prefilledState = useSwapPrefilledState({
    input: currencyToAsset(initialInputCurrency),
    output: currencyToAsset(initialOutputCurrency),
    exactAmountToken: '',
    exactCurrencyField: CurrencyField.INPUT,
  })

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
          padding: '0 var(--tm-gutter)',
        }}
      >
        <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, color: terminalColors.ink }}>Limit</span>
        <span style={{ fontFamily: SANS, fontSize: 12, color: terminalColors.ink3Alt }}>
          Set a price · order fills when the market reaches it
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
          padding: '28px var(--tm-gutter) 48px',
        }}
      >
        <div style={{ width: '100%', maxWidth: MODULE_WIDTH }}>
          <MultichainContextProvider initialChainId={UniverseChainId.Mainnet}>
            <SwapTransactionSettingsStoreContextProvider>
              <SwapAndLimitContextProvider
                initialInputCurrency={initialInputCurrency}
                initialOutputCurrency={initialOutputCurrency}
              >
                <SwapFormStoreContextProvider prefilledState={prefilledState}>
                  <LimitFormWrapper />
                </SwapFormStoreContextProvider>
              </SwapAndLimitContextProvider>
            </SwapTransactionSettingsStoreContextProvider>
          </MultichainContextProvider>
        </div>
      </div>
    </div>
  )
}
