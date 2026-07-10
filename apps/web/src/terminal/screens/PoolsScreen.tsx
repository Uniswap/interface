/**
 * HookSwap Terminal — B4 Pools / Create position (dense).
 *
 * Adapted from design handoff screen B4 (column 1b) — see
 * `design_handoff_hookswap_terminal/screenshots/B04-create-position.png` and the B4
 * markup in `design/HookSwap Redesign.dc.html`: a left config column (01 Pair /
 * 02 Fee tier), a center liquidity-range panel with Min/Max price fields, and a right
 * deposit column (03 Deposit) with a summary + Create button. The design's "03 Hook"
 * step has been REMOVED entirely: HookSwap ships v2 + v3 only (locked decision
 * 2026-07-04 — hooks are a v4-only feature and are not part of this product), so there
 * is no hook step, hook selector, or "Hook" summary row anywhere in this screen.
 *
 * DATA POLICY (no mock data — handoff hard rule):
 *   • Token pickers — LIVE from the app's real per-chain token list: the active chain's
 *     static common-bases (`COMMON_BASES[chainId]` from routing.ts — the same source the
 *     Swap screen uses), which always covers HookSwap's own chains (e.g. Robinhood → ETH,
 *     USDG, WETH, tHOOK). Merged with `useListTokens` (the hosted feed the Markets screen
 *     uses) for live prices/logos + extra symbols on chains the backend indexes.
 *   • Fee tiers — real protocol fee tiers (0.01 / 0.05 / 0.30 / 1.00%).
 *   • Current price + the range band — derived from the two selected tokens' real USD
 *     prices; Min/Max are real user inputs; the band + handles reflect them.
 *   • Deposit USD summary — computed from real token prices × the user's entered amounts.
 *     Est fees / projected APR need pool state HookSwap does not yet index, so they
 *     render an honest "—" (never fabricated).
 *   • Create — a real CTA: disconnected → opens the wallet drawer; connected → continues
 *     into the app's real position-manager flow. No fake position numbers are shown.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { COMMON_BASES } from 'uniswap/src/constants/routing'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { ExploreContextProvider } from '~/features/Explore/state'
import { ExploreTablesFilterStoreContextProvider } from '~/features/Explore/state/exploreTablesFilterStore'
import { useListTokens } from '~/features/Explore/state/listTokens/useListTokens'
import { useAccount } from '~/hooks/useAccount'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

/* ------------------------------------------------------------------ data model */

interface TokenOption {
  symbol: string
  logoUrl?: string
  price?: number
}

interface FeeTier {
  label: string
  bps: number
}

const FEE_TIERS: readonly FeeTier[] = [
  { label: '0.01%', bps: 0.01 },
  { label: '0.05%', bps: 0.05 },
  { label: '0.30%', bps: 0.3 },
  { label: '1.00%', bps: 1.0 },
]

type RangeMode = 'full' | 'custom'

/* ------------------------------------------------------------------ helpers */

function sanitizeNumberInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, '')
  const first = cleaned.indexOf('.')
  if (first === -1) {
    return cleaned
  }
  return cleaned.slice(0, first + 1) + cleaned.slice(first + 1).replace(/\./g, '')
}

/** Parse a sanitized amount to a finite number (a lone "." → 0, never NaN). */
function toNum(raw: string): number {
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

function fmtPrice(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: value >= 1 ? 2 : 6,
  })
}

/* ------------------------------------------------------------------ token select */

function TokenCircle({ token, size = 22 }: { token?: TokenOption; size?: number }): JSX.Element {
  if (token?.logoUrl) {
    return (
      <img
        src={token.logoUrl}
        alt=""
        width={size}
        height={size}
        style={{ borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
      />
    )
  }
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: terminalColors.panel2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: MONO,
        fontSize: 10,
        fontWeight: 600,
        color: terminalColors.ink2,
        flexShrink: 0,
      }}
    >
      {token?.symbol?.slice(0, 1) ?? '?'}
    </span>
  )
}

function TokenSelect({
  value,
  options,
  onChange,
  loading,
}: {
  value?: TokenOption
  options: TokenOption[]
  onChange: (token: TokenOption) => void
  loading: boolean
}): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 11px',
          borderRadius: 10,
          border: `1px solid ${terminalColors.line}`,
          background: terminalColors.bg,
          cursor: loading ? 'default' : 'pointer',
          boxSizing: 'border-box',
        }}
      >
        <TokenCircle token={value} size={20} />
        <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: terminalColors.ink, flex: 1, textAlign: 'left' }}>
          {value?.symbol ?? (loading ? 'Loading…' : 'Select')}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: terminalColors.ink3Alt }}>▾</span>
      </button>
      {open ? (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
          />
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              maxHeight: 260,
              overflowY: 'auto',
              background: terminalColors.bg,
              border: `1px solid ${terminalColors.line}`,
              borderRadius: 10,
              boxShadow: '0 12px 30px -12px rgba(11,15,20,.28)',
              zIndex: 11,
              padding: 4,
            }}
          >
            {options.map((token) => (
              <button
                key={token.symbol}
                type="button"
                onClick={() => {
                  onChange(token)
                  setOpen(false)
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: value?.symbol === token.symbol ? terminalColors.panel : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <TokenCircle token={token} size={20} />
                <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: terminalColors.ink, flex: 1, textAlign: 'left' }}>
                  {token.symbol}
                </span>
                {token.price !== undefined ? (
                  <span style={{ fontFamily: MONO, fontSize: 11.5, color: terminalColors.ink3Alt }}>
                    ${fmtPrice(token.price)}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ small pieces */

function StepLabel({ index, label, note }: { index: string; label: string; note?: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', color: terminalColors.ink3Alt }}>
        {index} · {label.toUpperCase()}
      </span>
      {note ? (
        <span style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt }}>{note}</span>
      ) : null}
    </div>
  )
}

function SummaryRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0' }}>
      <span style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink3Alt }}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: valueColor ?? terminalColors.ink }}>
        {value}
      </span>
    </div>
  )
}

function Panel({ children, padding = 18 }: { children: React.ReactNode; padding?: number }): JSX.Element {
  return (
    <div
      style={{
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 14,
        background: terminalColors.bg,
        padding,
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ range band */

function RangeBand({
  min,
  max,
  current,
}: {
  min: number | undefined
  max: number | undefined
  current: number | undefined
}): JSX.Element {
  // Axis spans a little beyond the [min,max] range so the band sits inset. All real
  // (user min/max + price-derived current); no fabricated liquidity distribution.
  const haveRange = min !== undefined && max !== undefined && max > min
  const axisMin = haveRange ? min - (max - min) * 0.35 : 0
  const axisMax = haveRange ? max + (max - min) * 0.35 : 1
  const span = axisMax - axisMin || 1
  const pct = (v: number): number => Math.max(0, Math.min(100, ((v - axisMin) / span) * 100))

  const leftPct = haveRange ? pct(min) : 30
  const rightPct = haveRange ? pct(max) : 70
  const currentPct = current !== undefined && haveRange ? pct(current) : undefined

  return (
    <div style={{ marginTop: 6 }}>
      <div
        style={{
          position: 'relative',
          height: 150,
          borderRadius: 10,
          background: terminalColors.panel,
          border: `1px solid ${terminalColors.line2}`,
          overflow: 'hidden',
        }}
      >
        {/* In-range shaded band */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${leftPct}%`,
            width: `${Math.max(0, rightPct - leftPct)}%`,
            background: 'rgba(47,224,126,0.14)',
            borderLeft: `2px solid ${terminalColors.brandGreen}`,
            borderRight: `2px solid ${terminalColors.brandGreen}`,
          }}
        />
        {/* Current price marker */}
        {currentPct !== undefined ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${currentPct}%`,
              width: 0,
              borderLeft: `1px dashed ${terminalColors.ink3}`,
            }}
          />
        ) : null}
      </div>
      {/* Axis ticks */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontFamily: MONO, fontSize: 11, color: terminalColors.faint }}>
          {haveRange ? fmtPrice(axisMin) : '—'}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 11.5, color: terminalColors.ink }}>
          {current !== undefined ? fmtPrice(current) : '—'}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: terminalColors.faint }}>
          {haveRange ? fmtPrice(axisMax) : '—'}
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ price field */

function PriceField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled: boolean
}): JSX.Element {
  return (
    <div
      style={{
        flex: 1,
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 11,
        background: disabled ? terminalColors.panel : terminalColors.bg,
        padding: '10px 12px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt, marginBottom: 4 }}>{label}</div>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(sanitizeNumberInput(e.target.value))}
        placeholder="0.00"
        inputMode="decimal"
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: MONO,
          fontSize: 16,
          fontWeight: 600,
          color: terminalColors.ink,
          padding: 0,
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ the screen */

function PoolsScreenBody(): JSX.Element {
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const navigate = useNavigate()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const { topTokens, isLoading: tokensLoading } = useListTokens(undefined)

  // The active chain — the connected wallet's chain, defaulting to Robinhood (the
  // Terminal's live chain) when disconnected, mirroring SwapScreen. Determines which
  // static common-bases list seeds the token pickers.
  const chainId = account.chainId ?? UniverseChainId.Robinhood

  // Real token options (dedup by symbol, keep price + logo).
  //
  // PRIMARY source: the active chain's static common-bases list
  // (`COMMON_BASES[chainId]` from routing.ts). This is the app's own per-chain token
  // list and is ALWAYS populated for HookSwap's own chains (e.g. Robinhood → ETH,
  // USDG, WETH, tHOOK). The hosted token backend behind `useListTokens` does NOT index
  // HookSwap chains, so on those chains `topTokens` is empty — using it alone left the
  // pickers with nothing selectable.
  //
  // SECONDARY source: `topTokens` (the hosted token list) is merged in for chains the
  // backend DOES serve — it enriches the static entries with live USD prices/logos and
  // appends extra symbols. It never removes a static base.
  const options: TokenOption[] = useMemo(() => {
    const bySymbol = new Map<string, TokenOption>()

    for (const info of COMMON_BASES[chainId] ?? []) {
      const symbol = info.currency.symbol
      if (!symbol || bySymbol.has(symbol)) {
        continue
      }
      bySymbol.set(symbol, {
        symbol,
        logoUrl: info.logoUrl ?? undefined,
      })
    }

    for (const token of topTokens) {
      if (!token.symbol) {
        continue
      }
      const existing = bySymbol.get(token.symbol)
      if (existing) {
        // Enrich the static base with live data where it's missing.
        if (existing.price === undefined && token.stats?.price !== undefined) {
          existing.price = token.stats.price
        }
        if (!existing.logoUrl && token.logoUrl) {
          existing.logoUrl = token.logoUrl
        }
        continue
      }
      bySymbol.set(token.symbol, {
        symbol: token.symbol,
        logoUrl: token.logoUrl || undefined,
        price: token.stats?.price,
      })
    }

    return Array.from(bySymbol.values()).slice(0, 50)
  }, [topTokens, chainId])

  const [token0, setToken0] = useState<TokenOption | undefined>()
  const [token1, setToken1] = useState<TokenOption | undefined>()
  const [feeIndex, setFeeIndex] = useState(1) // default 0.05%

  // Preselect the pair when arriving from a Market-Detail "Add liquidity" deep-link
  // (`?token0=SYM&token1=SYM`). Symbols are matched against the live token list; a
  // symbol not in the list is left unset (falls back to the ETH/USDC defaults). Runs
  // once, after options load, so it never clobbers the user's later manual picks.
  const [searchParams] = useSearchParams()
  const didSeedFromParams = useRef(false)
  useEffect(() => {
    if (didSeedFromParams.current || options.length === 0) {
      return
    }
    const sym0 = searchParams.get('token0')
    const sym1 = searchParams.get('token1')
    if (sym0 || sym1) {
      const find = (sym: string | null): TokenOption | undefined =>
        sym ? options.find((o) => o.symbol.toUpperCase() === sym.toUpperCase()) : undefined
      const t0 = find(sym0)
      const t1 = find(sym1)
      if (t0) {
        setToken0(t0)
      }
      if (t1) {
        setToken1(t1)
      }
    }
    didSeedFromParams.current = true
  }, [options, searchParams])
  const [rangeMode, setRangeMode] = useState<RangeMode>('custom')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [amount0, setAmount0] = useState('')
  const [amount1, setAmount1] = useState('')

  // Seed defaults once tokens load (ETH/USDC when available). When those symbols are
  // absent for the active chain (e.g. Robinhood has no USDC), fall back to the first
  // available options so the form is never empty and the two picks always differ.
  const resolvedToken0 = token0 ?? options.find((o) => o.symbol === 'ETH' || o.symbol === 'WETH') ?? options[0]
  const resolvedToken1 =
    token1 ?? options.find((o) => o.symbol === 'USDC') ?? options.find((o) => o.symbol !== resolvedToken0?.symbol)

  // Current price of token0 in token1 (real, from USD prices).
  const currentPrice =
    resolvedToken0?.price && resolvedToken1?.price && resolvedToken1.price > 0
      ? resolvedToken0.price / resolvedToken1.price
      : undefined

  const min = rangeMode === 'full' ? undefined : minPrice ? Number(minPrice) : undefined
  const max = rangeMode === 'full' ? undefined : maxPrice ? Number(maxPrice) : undefined

  // Effective band for the visualization: user inputs, else ±15% of current price.
  const bandMin = min ?? (currentPrice ? currentPrice * 0.85 : undefined)
  const bandMax = max ?? (currentPrice ? currentPrice * 1.15 : undefined)

  const depositUsd = useMemo(() => {
    const v0 = resolvedToken0?.price ? toNum(amount0) * resolvedToken0.price : 0
    const v1 = resolvedToken1?.price ? toNum(amount1) * resolvedToken1.price : 0
    return v0 + v1
  }, [amount0, amount1, resolvedToken0?.price, resolvedToken1?.price])

  // Per-field USD (real: entered amount × the token's live price). Undefined when there
  // is no price or no positive amount → the field shows nothing (never a fabricated value).
  const fmtFieldUsd = (amount: string, price?: number): string | undefined => {
    const n = toNum(amount)
    if (!price || n <= 0) {
      return undefined
    }
    return convertFiatAmountFormatted(n * price, NumberType.PortfolioBalance)
  }

  const isConnected = Boolean(account.address)
  const canContinue = Boolean(resolvedToken0 && resolvedToken1)

  const onCreate = (): void => {
    if (!isConnected) {
      accountDrawer.open()
      return
    }
    // Continue into the app's real position-manager flow (v2/v3 add-liquidity),
    // forwarding the selected fee tier via the route's `feeTier` param (a fee amount
    // in hundredths of a bip: 0.05% → 500). The create route's URL migration expands
    // it into the full fee object.
    //
    // NOT forwarded (the create route can't consume them from this form): the token
    // pair — this form models tokens by SYMBOL only (`TokenOption` has no address or
    // chainId), whereas the create route requires validated on-chain `currencyA`/
    // `currencyB` addresses + a `chain` id; and the price range / deposit amounts —
    // the route reads tick-based `priceRangeState` (minTick/maxTick) and a
    // `depositState` keyed by PositionField, not the raw min/max prices + amounts this
    // form holds. Forwarding those would require fabricating addresses/ticks, so only
    // the fee tier is carried.
    const feeAmount = Math.round(FEE_TIERS[feeIndex].bps * 10000)
    const params = new URLSearchParams({ feeTier: String(feeAmount) })
    navigate(`/positions/create?${params.toString()}`)
  }

  return (
    <div style={{ padding: '20px var(--tm-gutter) 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 }}>
        <h1
          style={{
            fontFamily: DISPLAY,
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: terminalColors.ink,
            margin: 0,
          }}
        >
          New position
        </h1>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 11,
            fontWeight: 600,
            color: terminalColors.greenDeep,
            background: terminalColors.greenBg,
            border: `1px solid ${terminalColors.greenBorder}`,
            padding: '3px 8px',
            borderRadius: 999,
          }}
        >
          v2 · v3
        </span>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left config column */}
        <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel>
            <StepLabel index="01" label="Pair" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <TokenSelect value={resolvedToken0} options={options} onChange={setToken0} loading={tokensLoading} />
              <TokenSelect value={resolvedToken1} options={options} onChange={setToken1} loading={tokensLoading} />
            </div>
          </Panel>

          <Panel>
            <StepLabel index="02" label="Fee tier" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {FEE_TIERS.map((tier, i) => {
                const active = feeIndex === i
                return (
                  <button
                    key={tier.label}
                    type="button"
                    onClick={() => setFeeIndex(i)}
                    style={{
                      padding: '9px 0',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontFamily: MONO,
                      fontSize: 13,
                      fontWeight: 600,
                      color: active ? terminalColors.greenDeep : terminalColors.ink2,
                      background: active ? terminalColors.greenBg : terminalColors.bg,
                      border: `1px solid ${active ? terminalColors.greenBorder : terminalColors.line}`,
                    }}
                  >
                    {tier.label}
                  </button>
                )
              })}
            </div>
          </Panel>
        </div>

        {/* Center liquidity range */}
        <div style={{ flex: '1 1 360px', minWidth: 0 }}>
          <Panel>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: terminalColors.ink }}>
                Liquidity range
              </span>
              <div style={{ display: 'flex', gap: 3, background: terminalColors.panel2, padding: 3, borderRadius: 9 }}>
                {(['full', 'custom'] as const).map((mode) => {
                  const active = rangeMode === mode
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setRangeMode(mode)}
                      style={{
                        padding: '5px 14px',
                        borderRadius: 7,
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: SANS,
                        fontSize: 12.5,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        color: active ? terminalColors.ink : terminalColors.ink2,
                        background: active ? terminalColors.bg : 'transparent',
                        boxShadow: active ? '0 1px 2px rgba(11,15,20,.06)' : undefined,
                      }}
                    >
                      {mode}
                    </button>
                  )
                })}
              </div>
            </div>

            <RangeBand min={bandMin} max={bandMax} current={currentPrice} />

            {/* Min / Max price fields */}
            <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
              <PriceField
                label={`Min price${resolvedToken1 ? ` (${resolvedToken1.symbol})` : ''}`}
                value={rangeMode === 'full' ? '0' : minPrice}
                onChange={setMinPrice}
                disabled={rangeMode === 'full'}
              />
              <PriceField
                label={`Max price${resolvedToken1 ? ` (${resolvedToken1.symbol})` : ''}`}
                value={rangeMode === 'full' ? '∞' : maxPrice}
                onChange={setMaxPrice}
                disabled={rangeMode === 'full'}
              />
            </div>

            <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, marginTop: 12, lineHeight: 1.5 }}>
              Current price derived from live token prices. Full liquidity-distribution histogram builds as pools gain
              liquidity.
            </div>
          </Panel>
        </div>

        {/* Right deposit column */}
        <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel>
            <StepLabel index="03" label="Deposit" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <DepositField
                token={resolvedToken0}
                amount={amount0}
                onChange={setAmount0}
                usd={fmtFieldUsd(amount0, resolvedToken0?.price)}
              />
              <DepositField
                token={resolvedToken1}
                amount={amount1}
                onChange={setAmount1}
                usd={fmtFieldUsd(amount1, resolvedToken1?.price)}
              />
            </div>
          </Panel>

          <Panel>
            <SummaryRow
              label="Deposit"
              value={depositUsd > 0 ? convertFiatAmountFormatted(depositUsd, NumberType.PortfolioBalance) : '$0.00'}
            />
            <SummaryRow label="Fee tier" value={FEE_TIERS[feeIndex].label} />
            {/* Requires pool state we do not yet index — honest "—". */}
            <SummaryRow label="Est fees 24h" value="—" valueColor={terminalColors.faint} />
            <SummaryRow label="Projected APR" value="—" valueColor={terminalColors.faint} />

            <button
              type="button"
              onClick={onCreate}
              disabled={!canContinue}
              style={{
                marginTop: 12,
                width: '100%',
                fontFamily: SANS,
                fontSize: 14,
                fontWeight: 600,
                color: terminalColors.btnInk,
                background: canContinue ? terminalColors.brandGreen : terminalColors.line,
                border: 'none',
                padding: '12px 0',
                borderRadius: 12,
                cursor: canContinue ? 'pointer' : 'default',
              }}
            >
              {isConnected ? 'Continue in position manager' : 'Connect wallet to add liquidity'}
            </button>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function DepositField({
  token,
  amount,
  onChange,
  usd,
}: {
  token?: TokenOption
  amount: string
  onChange: (v: string) => void
  usd?: string
}): JSX.Element {
  return (
    <div
      style={{
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 11,
        background: terminalColors.bg,
        padding: '11px 12px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <TokenCircle token={token} size={20} />
          <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: terminalColors.ink }}>
            {token?.symbol ?? '—'}
          </span>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <input
          value={amount}
          onChange={(e) => onChange(sanitizeNumberInput(e.target.value))}
          placeholder="0.00"
          inputMode="decimal"
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: MONO,
            fontSize: 20,
            fontWeight: 600,
            color: terminalColors.ink,
            padding: 0,
          }}
        />
        {usd ? (
          <span style={{ fontFamily: MONO, fontSize: 11, color: terminalColors.ink3Alt, flexShrink: 0 }}>{usd}</span>
        ) : null}
      </div>
    </div>
  )
}

/**
 * B4 Pools / Create position. Wrapped in the same Explore providers the Markets screen
 * uses so the real token-list query (`useListTokens`) resolves.
 */
export function PoolsScreen(): JSX.Element {
  return (
    <ExploreContextProvider>
      <ExploreTablesFilterStoreContextProvider>
        <PoolsScreenBody />
      </ExploreTablesFilterStoreContextProvider>
    </ExploreContextProvider>
  )
}
