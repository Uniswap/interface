/**
 * HookSwap embeddable swap widget — chromeless page mounted at `/embed/swap`.
 *
 * A self-contained swap card a third-party site drops in via an <iframe>. It
 * reuses the app's REAL swap engine (the same provider stack + live Trading-API
 * quote the main Terminal swap uses) and the exact `SwapTicket` component, so the
 * embed shows real balances/quotes — no mock data. Initial state (chain, tokens,
 * theme) comes entirely from URL params (see {@link parseEmbedConfig}).
 *
 * The route is registered as a page-layout override (no rail, no top bar, no app
 * header — see App.tsx `OVERRIDE_PAGE_LAYOUT`), so it renders inside the app's
 * root providers (web3 / query / theme) but owns the full viewport.
 *
 * Attribution: a "Powered by HookSwap" lockup links back to hookswap.org.
 */
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { SwapTransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/SwapTransactionSettingsStoreContextProvider'
import {
  TransactionModalContextProvider,
  TransactionScreen,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useSwapPrefilledState } from 'uniswap/src/features/transactions/swap/form/hooks/useSwapPrefilledState'
import { SwapFormStoreContextProvider } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContextProvider'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapAndLimitContextProvider } from '~/features/Swap/state/SwapContext'
import { MultichainContextProvider } from '~/state/multichain/MultichainContext'
import { SwapTicket } from '~/terminal/screens/SwapScreen'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'
import { parseEmbedConfig, type WidgetTheme } from '~/embed/embedParams'

/** Page backdrop per theme — the ticket itself is a light card in both. */
function pageBackground(theme: WidgetTheme): string {
  return theme === 'dark' ? terminalColors.ink : terminalColors.bgApp
}

/** "Powered by HookSwap" lockup — dark pill on light, white lockup on dark. */
function PoweredByHookSwap({ theme }: { theme: WidgetTheme }): JSX.Element {
  const src = theme === 'dark' ? '/brand/powered-by/powered-by-inline-white.png' : '/brand/powered-by/powered-by-inline-ink.png'
  return (
    <a
      href="https://hookswap.org"
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'inline-flex', marginTop: 12, opacity: 0.9 }}
    >
      <img src={src} alt="Powered by HookSwap" height={16} style={{ height: 16, width: 'auto', display: 'block' }} />
    </a>
  )
}

/**
 * The widget body. Mounts the swap-engine provider stack (multichain → tx
 * settings → swap-and-limit → swap form store → tx-modal ctx) seeded from the
 * embed config, then renders the shared `SwapTicket`. Currencies are seeded via
 * the form store's prefilled state (bare address+chain assets) — no `Currency`
 * objects needed, so a host only supplies token addresses.
 */
export function SwapWidgetPage(): JSX.Element {
  const [searchParams] = useSearchParams()
  const config = useMemo(() => parseEmbedConfig(searchParams), [searchParams])

  const prefilledState = useSwapPrefilledState(
    useMemo(
      () => ({
        input: config.inputAsset,
        output: config.outputAsset ?? undefined,
        exactAmountToken: '',
        exactCurrencyField: CurrencyField.INPUT,
      }),
      [config.inputAsset, config.outputAsset],
    ),
  )

  // Minimal transaction-modal context (mirrors SwapScreen) — the token selector's
  // selection hooks require it even outside a modal flow.
  const [txScreen, setTxScreen] = useState<TransactionScreen>(TransactionScreen.Form)

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: 16,
        boxSizing: 'border-box',
        background: pageBackground(config.theme),
        fontFamily: terminalFonts.sans,
      }}
    >
      <div
        style={{
          background: terminalColors.bg,
          border: `1px solid ${terminalColors.line}`,
          borderRadius: 18,
          boxShadow: '0 12px 40px -16px rgba(11,15,20,0.28)',
          overflow: 'hidden',
        }}
      >
        <MultichainContextProvider initialChainId={config.chainId}>
          <SwapTransactionSettingsStoreContextProvider>
            <SwapAndLimitContextProvider>
              <SwapFormStoreContextProvider prefilledState={prefilledState}>
                <TransactionModalContextProvider
                  bottomSheetViewStyles={{}}
                  screen={txScreen}
                  setScreen={setTxScreen}
                  onClose={() => undefined}
                >
                  <SwapTicket />
                </TransactionModalContextProvider>
              </SwapFormStoreContextProvider>
            </SwapAndLimitContextProvider>
          </SwapTransactionSettingsStoreContextProvider>
        </MultichainContextProvider>
      </div>
      <PoweredByHookSwap theme={config.theme} />
    </div>
  )
}

export default SwapWidgetPage
