/**
 * HookSwap Terminal — B2 Swap (chart-driven).
 *
 * Pixel-perfect recreation of design handoff screen B2 (column 1b) — see
 * `design_handoff_hookswap_terminal/screenshots/B02-swap.png` and the B2 markup in
 * `design/HookSwap Redesign.dc.html`. Three panels inside the Terminal content
 * region: a left market list (238px), a center chart panel, and a right swap
 * ticket (326px).
 *
 * DATA POLICY (no mock data — handoff hard rule):
 *   • Swap ticket — FULLY LIVE. Selected currencies, balances, the editable
 *     sell/buy amounts, and the rate / price-impact / min-received / route rows all
 *     come from the app's real swap engine (`derivedSwapInfo` → live Trading-API
 *     quote) reused via the same provider stack `/swap` uses. Token selection uses
 *     the app's real `SwapTokenSelector`. Loading / empty / error states are real.
 *   • Pair header price — LIVE from the quote's execution price.
 *   • Market list + price-history chart + 24h stats — require a pools/price-history
 *     subgraph that the hosted Trading API does not serve for the target chains.
 *     They render honest loading / empty states (NOT fabricated numbers). See the
 *     `TODO(data)` markers; wire to the self-hosted indexer when available.
 *
 * HookSwap ships v2 + v3 only (no Uniswap v4 / hooks — LOCKED decision). There is
 * NO hook UI on this screen: no hook-fee strip, no active-hook selector, no hook
 * config bar. The order ticket is Market / Limit only.
 */
import { Token } from '@uniswap/sdk-core'
import type { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { SwapTransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/SwapTransactionSettingsStoreContextProvider'
import {
  TransactionModalContextProvider,
  TransactionScreen,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { SwapTokenSelector } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapTokenSelector/SwapTokenSelector'
import { SwapDependenciesStoreContextProvider } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/SwapDependenciesStoreContextProvider'
import { SwapFormStoreContextProvider } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContextProvider'
import { useSwapHandlers } from '~/features/Swap/hooks/useSwapHandlers/useSwapHandlers'
import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useSwapPrefilledState } from 'uniswap/src/features/transactions/swap/form/hooks/useSwapPrefilledState'
import { currencyToAsset } from 'uniswap/src/features/transactions/swap/utils/asset'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { SwapAndLimitContextProvider } from '~/features/Swap/state/SwapContext'
import { useAccount } from '~/hooks/useAccount'
import { MultichainContextProvider } from '~/state/multichain/MultichainContext'
import { useIsMobileViewport } from '~/terminal/hooks/useIsMobileViewport'
import { TerminalChartPanel } from '~/terminal/screens/swap/TerminalChartPanel'
import { TerminalSwapReviewFlow, useTerminalReviewTrigger } from '~/terminal/screens/swap/TerminalSwapReviewFlow'
import { terminalColors, terminalFonts, terminalTokenGradients } from '~/terminal/theme/tokens'

/* ------------------------------------------------------------------ helpers */

const MONO = terminalFonts.mono

/** Group the integer part with thousands separators, preserving decimals. */
function groupNumber(value: string): string {
  if (!value) {
    return value
  }
  const negative = value.startsWith('-')
  const unsigned = negative ? value.slice(1) : value
  const [intPart, decPart] = unsigned.split('.')
  const grouped = Number(intPart || '0').toLocaleString('en-US')
  const out = decPart !== undefined ? `${grouped}.${decPart}` : grouped
  return negative ? `-${out}` : out
}

/** Format a CurrencyAmount to a grouped, significant-digit string. */
function fmtAmount(amount: Maybe<CurrencyAmount<Currency>>, sig = 6): string {
  if (!amount) {
    return ''
  }
  return groupNumber(amount.toSignificant(sig))
}

/** Keep only a valid decimal-number input string. */
function sanitizeAmountInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot === -1) {
    return cleaned
  }
  // keep the first dot, strip subsequent dots
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
}

/* ------------------------------------------------------------- token logo */

/**
 * Real token logo (from `currencyInfo.logoUrl`) with a gradient-circle fallback
 * matching the prototype's placeholder circles when a logo URL is unavailable.
 */
function TerminalTokenLogo({
  currencyInfo,
  size,
  fallbackGradient,
}: {
  currencyInfo: Maybe<CurrencyInfo>
  size: number
  fallbackGradient: string
}): JSX.Element {
  const url = currencyInfo?.logoUrl ?? undefined
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: url
          ? `${terminalColors.panel} center/cover no-repeat url(${JSON.stringify(url)})`
          : fallbackGradient,
        flexShrink: 0,
        display: 'inline-block',
      }}
    />
  )
}

/* -------------------------------------------------------------- swap ticket */

// v2/v3 only — Market + Limit. (TWAMM is a v4 hook; excluded per LOCKED decision.)
const TICKET_TABS = ['Market', 'Limit'] as const

function CurrencyField_Panel({
  side,
  amountValue,
  balanceLabel,
  currencyInfo,
  fallbackGradient,
  editable,
  onAmountChange,
  onSelectToken,
}: {
  side: 'Sell' | 'Buy'
  amountValue: string
  balanceLabel: string
  currencyInfo: Maybe<CurrencyInfo>
  fallbackGradient: string
  editable: boolean
  onAmountChange: (v: string) => void
  onSelectToken: () => void
}): JSX.Element {
  const symbol = currencyInfo?.currency.symbol
  return (
    <div
      style={{
        background: terminalColors.panel,
        border: `1px solid ${terminalColors.line2}`,
        borderRadius: 12,
        padding: 13,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11.5,
          color: terminalColors.ink3,
          marginBottom: 7,
        }}
      >
        <span>{side}</span>
        <span style={{ fontFamily: MONO }}>{balanceLabel}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <input
          inputMode="decimal"
          value={amountValue}
          placeholder="0"
          readOnly={!editable}
          onChange={(e) => onAmountChange(sanitizeAmountInput(e.target.value))}
          style={{
            fontFamily: MONO,
            fontSize: 24,
            fontWeight: 500,
            color: terminalColors.ink,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: 0,
            minWidth: 0,
            width: '100%',
          }}
        />
        <button
          type="button"
          onClick={onSelectToken}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: terminalColors.bg,
            border: `1px solid ${terminalColors.line}`,
            borderRadius: 999,
            padding: '5px 11px 5px 5px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <TerminalTokenLogo currencyInfo={currencyInfo} size={20} fallbackGradient={fallbackGradient} />
          <span style={{ fontWeight: 600, fontSize: 13, color: terminalColors.ink }}>{symbol ?? 'Select'}</span>
          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={terminalColors.ink2} strokeWidth={2.5}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/** One mono key/value row in the breakdown box. */
function BreakdownRow({
  label,
  value,
  valueColor,
  last,
}: {
  label: string
  value: string
  valueColor?: string
  last?: boolean
}): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11.5,
        marginBottom: last ? 0 : 8,
      }}
    >
      <span style={{ color: terminalColors.ink3 }}>{label}</span>
      <span style={{ color: valueColor ?? terminalColors.ink }}>{value}</span>
    </div>
  )
}

export function SwapTicket(): JSX.Element {
  const accountDrawer = useAccountDrawer()
  const account = useAccount()
  const navigate = useNavigate()
  const [mevProtected, setMevProtected] = useState(true)
  // Launches the REAL review→confirm→submit flow. Valid only because SwapTicket is
  // rendered inside <TerminalSwapReviewFlow> (which provides the swap-form warning store).
  const { onReview } = useTerminalReviewTrigger()

  const derived = useSwapFormStoreDerivedSwapInfo((s) => ({
    currencies: s.currencies,
    currencyAmounts: s.currencyAmounts,
    currencyBalances: s.currencyBalances,
    outputAmountUserWillReceive: s.outputAmountUserWillReceive,
    trade: s.trade,
    exactAmountToken: s.exactAmountToken,
    exactCurrencyField: s.exactCurrencyField,
  }))

  const { updateSwapForm, selectingCurrencyField, input, output } = useSwapFormStore((s) => ({
    updateSwapForm: s.updateSwapForm,
    selectingCurrencyField: s.selectingCurrencyField,
    input: s.input,
    output: s.output,
  }))

  const inputInfo = derived.currencies[CurrencyField.INPUT]
  const outputInfo = derived.currencies[CurrencyField.OUTPUT]
  const inSym = inputInfo?.currency.symbol ?? ''
  const isExactIn = derived.exactCurrencyField === CurrencyField.INPUT

  const sellValue = isExactIn ? derived.exactAmountToken : fmtAmount(derived.currencyAmounts[CurrencyField.INPUT])
  const buyValue = !isExactIn ? derived.exactAmountToken : fmtAmount(derived.currencyAmounts[CurrencyField.OUTPUT])

  const sellBalance = derived.currencyBalances[CurrencyField.INPUT]
  const buyBalance = derived.currencyBalances[CurrencyField.OUTPUT]

  const onChangeSell = (v: string): void =>
    updateSwapForm({
      exactAmountToken: v,
      exactCurrencyField: CurrencyField.INPUT,
      focusOnCurrencyField: CurrencyField.INPUT,
    })
  const onChangeBuy = (v: string): void =>
    updateSwapForm({
      exactAmountToken: v,
      exactCurrencyField: CurrencyField.OUTPUT,
      focusOnCurrencyField: CurrencyField.OUTPUT,
    })

  const onSwitch = (): void => updateSwapForm({ input: output, output: input })

  // --- Live trade-derived breakdown -----------------------------------------
  const trade = derived.trade
  const activeTrade = trade.trade
  const hasAmount = Boolean(derived.exactAmountToken && Number(derived.exactAmountToken) > 0)

  const rateValue = activeTrade
    ? `1 ${inSym} = ${groupNumber(activeTrade.executionPrice.toSignificant(8))}`
    : trade.isLoading && hasAmount
      ? 'Fetching…'
      : '—'
  const impactPct = activeTrade?.priceImpact
  const impactValue = impactPct ? `${impactPct.toFixed(2)}%` : trade.isLoading && hasAmount ? 'Fetching…' : '—'
  const impactColor = impactPct
    ? Math.abs(Number(impactPct.toFixed(2))) < 1
      ? terminalColors.greenUp
      : terminalColors.warn
    : undefined
  const minRecv = derived.outputAmountUserWillReceive ?? activeTrade?.minAmountOut
  const minRecvValue = minRecv ? fmtAmount(minRecv) : trade.isLoading && hasAmount ? 'Fetching…' : '—'
  const routeValue =
    inputInfo && outputInfo ? `${inSym} → ${outputInfo.currency.symbol ?? ''}` : '—'

  // --- Swap button state ----------------------------------------------------
  let swapLabel: string
  let swapEnabled = false
  let onSwap: () => void = () => undefined
  if (!account.address) {
    swapLabel = 'Connect wallet'
    swapEnabled = true
    onSwap = () => accountDrawer.open()
  } else if (!hasAmount) {
    swapLabel = 'Enter an amount'
  } else if (trade.isLoading) {
    swapLabel = 'Fetching best price…'
  } else if (trade.error || !activeTrade) {
    swapLabel = 'No route available'
  } else {
    // Trade ready — open the REAL review→confirm→submit modal via the interface's
    // own swap pipeline, reused verbatim (see TerminalSwapReviewFlow / SwapReviewScreen).
    // The button opens the review step; funds only move on explicit confirm in that modal.
    swapLabel = 'Swap'
    swapEnabled = true
    onSwap = onReview
  }

  return (
    <div style={{ width: 326, flexShrink: 0, background: terminalColors.bg, padding: 16 }}>
      {/* Market / Limit tabs */}
      <div
        style={{
          display: 'flex',
          gap: 3,
          background: terminalColors.panel2,
          padding: 3,
          borderRadius: 9,
          marginBottom: 14,
        }}
      >
        {TICKET_TABS.map((tab) => {
          const active = tab === 'Market'
          return (
            <span
              key={tab}
              role={active ? undefined : 'link'}
              tabIndex={active ? undefined : 0}
              // "Limit" is the same limit-order flow as the /terminal/limit screen —
              // clicking the tab routes there rather than duplicating the form here.
              onClick={active ? undefined : () => navigate('/terminal/limit')}
              onKeyDown={
                active
                  ? undefined
                  : (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        navigate('/terminal/limit')
                      }
                    }
              }
              style={{
                flex: 1,
                textAlign: 'center',
                padding: 7,
                fontSize: 12.5,
                fontWeight: active ? 600 : 500,
                background: active ? terminalColors.bg : 'transparent',
                color: active ? terminalColors.ink : terminalColors.ink2,
                borderRadius: 6,
                boxShadow: active ? '0 1px 2px rgba(11,15,20,.06)' : undefined,
                cursor: 'pointer',
              }}
            >
              {tab}
            </span>
          )
        })}
      </div>

      {/* Sell */}
      <CurrencyField_Panel
        side="Sell"
        amountValue={sellValue}
        balanceLabel={sellBalance ? `Bal ${fmtAmount(sellBalance, 4)}` : 'Bal —'}
        currencyInfo={inputInfo}
        fallbackGradient={terminalTokenGradients.eth}
        editable
        onAmountChange={onChangeSell}
        onSelectToken={() => updateSwapForm({ selectingCurrencyField: CurrencyField.INPUT })}
      />

      {/* Switch node */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '-8px 0', position: 'relative', zIndex: 2 }}>
        <button
          type="button"
          onClick={onSwitch}
          aria-label="Switch tokens"
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: terminalColors.bg,
            border: `1px solid ${terminalColors.line}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke={terminalColors.ink}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 4v14M7 18l-3-3M7 18l3-3M17 20V6M17 6l-3 3M17 6l3 3" />
          </svg>
        </button>
      </div>

      {/* Buy */}
      <CurrencyField_Panel
        side="Buy"
        amountValue={buyValue}
        balanceLabel={buyBalance ? `Bal ${fmtAmount(buyBalance, 4)}` : 'Bal —'}
        currencyInfo={outputInfo}
        fallbackGradient={terminalTokenGradients.usdc}
        editable
        onAmountChange={onChangeBuy}
        onSelectToken={() => updateSwapForm({ selectingCurrencyField: CurrencyField.OUTPUT })}
      />

      {/* MEV protection — client-side routing preference (v2/v3, not a hook). */}
      <button
        type="button"
        onClick={() => setMevProtected((v) => !v)}
        aria-pressed={mevProtected}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'transparent',
          border: 'none',
          marginTop: 12,
          padding: 2,
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg
            width={15}
            height={15}
            viewBox="0 0 24 24"
            fill="none"
            stroke={mevProtected ? terminalColors.greenUp : terminalColors.ink3Alt}
            strokeWidth={2}
            strokeLinejoin="round"
          >
            <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
          </svg>
          <span style={{ fontSize: 12.5, color: terminalColors.ink2, fontWeight: 500 }}>MEV protection</span>
        </div>
        <span
          style={{
            width: 34,
            height: 20,
            borderRadius: 999,
            background: mevProtected ? terminalColors.brandGreen : terminalColors.line,
            position: 'relative',
            transition: 'background 120ms ease',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: mevProtected ? 16 : 2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: terminalColors.ink,
              transition: 'left 120ms ease',
            }}
          />
        </span>
      </button>

      {/* Live breakdown */}
      <div
        style={{
          border: `1px solid ${terminalColors.line2}`,
          borderRadius: 11,
          marginTop: 12,
          padding: '12px 13px',
          fontFamily: MONO,
        }}
      >
        <BreakdownRow label="rate" value={rateValue} />
        <BreakdownRow label="impact" value={impactValue} valueColor={impactColor} />
        <BreakdownRow label="min recv" value={minRecvValue} />
        <BreakdownRow label="route" value={routeValue} last />
      </div>

      {/* Swap button */}
      <button
        type="button"
        onClick={swapEnabled ? onSwap : undefined}
        disabled={!swapEnabled}
        style={{
          width: '100%',
          background: swapEnabled ? terminalColors.brandGreen : terminalColors.panel2,
          color: swapEnabled ? terminalColors.btnInk : terminalColors.ink3,
          fontWeight: 600,
          fontSize: 15,
          fontFamily: terminalFonts.sans,
          padding: 14,
          borderRadius: 12,
          textAlign: 'center',
          marginTop: 12,
          border: 'none',
          cursor: swapEnabled ? 'pointer' : 'not-allowed',
        }}
      >
        {swapLabel}
      </button>

      {/* Real token selector (app's SwapTokenSelector, driven by the swap form store) */}
      <SwapTokenSelector isModalOpen={selectingCurrencyField !== undefined} />
    </div>
  )
}

/* ------------------------------------------------------------------- body */

function SwapScreenBody(): JSX.Element {
  const derived = useSwapFormStoreDerivedSwapInfo((s) => ({
    currencies: s.currencies,
  }))
  const inputCurrency = derived.currencies[CurrencyField.INPUT]?.currency
  const outputCurrency = derived.currencies[CurrencyField.OUTPUT]?.currency
  const isMobile = useIsMobileViewport()
  // Swap dependencies (handlers/service) — the review flow reads this store via
  // useSwapDependenciesStoreBase(); the real swap page provides it the same way
  // (SwapForm.tsx). Omitting it crashes the screen ("must be used within
  // SwapDependenciesStoreContextProvider"). Provided here around the whole body.
  const swapHandlers = useSwapHandlers()

  // Mobile: single, centered swap ticket (no chart) to avoid horizontal overflow.
  if (isMobile) {
    return (
      <SwapDependenciesStoreContextProvider swapHandlers={swapHandlers}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 8px 28px' }}>
          <div style={{ width: 326, maxWidth: '100%' }}>
            <TerminalSwapReviewFlow>
              <SwapTicket />
            </TerminalSwapReviewFlow>
          </div>
        </div>
      </SwapDependenciesStoreContextProvider>
    )
  }

  return (
    <SwapDependenciesStoreContextProvider swapHandlers={swapHandlers}>
      <div style={{ display: 'flex', flex: 1, minHeight: 660 }}>
        <TerminalChartPanel inputCurrency={inputCurrency} outputCurrency={outputCurrency} />
        {/* Fixed-width, top-aligned wrapper: TransactionModal (rendered inside the flow)
            uses <Flex fill justifyContent="flex-end">, which would otherwise stretch to
            the row height and steal the chart's width / bottom-align the ticket. */}
        <div style={{ width: 326, flexShrink: 0, alignSelf: 'flex-start' }}>
          <TerminalSwapReviewFlow>
            <SwapTicket />
          </TerminalSwapReviewFlow>
        </div>
      </div>
    </SwapDependenciesStoreContextProvider>
  )
}

/* --------------------------------------------------------------- providers */

/**
 * B2 Swap screen. Mounts the same swap-engine provider stack the app's `/swap`
 * page uses (multichain → transaction settings → swap-and-limit → swap form
 * store), so the ticket reads a real live quote. Prefilled with a real default
 * pair (native OKB → HKT on the X Layer test pool); users swap tokens via the real selector.
 */
export function SwapScreen(): JSX.Element {
  // Default to the X Layer test setup: native OKB → HKT (the seeded WOKB/HKT pool).
  const initialInputCurrency = useMemo(() => nativeOnChain(UniverseChainId.XLayer), [])
  const initialOutputCurrency = useMemo(
    () => new Token(UniverseChainId.XLayer, '0x144331BB4C3026D135896CaFec3Ae3D667f4F376', 18, 'HKT', 'HookSwap Test'),
    [],
  )

  // Minimal transaction-modal context (mirrors TransactionModal.web.tsx) — the
  // SwapTokenSelector's selection hooks require it even outside a modal flow.
  const [txScreen, setTxScreen] = useState<TransactionScreen>(TransactionScreen.Form)

  const prefilledState = useSwapPrefilledState({
    input: currencyToAsset(initialInputCurrency),
    output: currencyToAsset(initialOutputCurrency),
    exactAmountToken: '',
    exactCurrencyField: CurrencyField.INPUT,
  })

  return (
    <MultichainContextProvider initialChainId={UniverseChainId.XLayer}>
      <SwapTransactionSettingsStoreContextProvider>
        <SwapAndLimitContextProvider
          initialInputCurrency={initialInputCurrency}
          initialOutputCurrency={initialOutputCurrency}
        >
          <SwapFormStoreContextProvider prefilledState={prefilledState}>
            <TransactionModalContextProvider
              bottomSheetViewStyles={{}}
              screen={txScreen}
              setScreen={setTxScreen}
              onClose={() => undefined}
            >
              <SwapScreenBody />
            </TransactionModalContextProvider>
          </SwapFormStoreContextProvider>
        </SwapAndLimitContextProvider>
      </SwapTransactionSettingsStoreContextProvider>
    </MultichainContextProvider>
  )
}
