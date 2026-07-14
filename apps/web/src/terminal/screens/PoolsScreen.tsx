/**
 * HookSwap Terminal — B4 Pools / Create v2 pool + seed liquidity (INLINE, client-side).
 *
 * Robinhood-only launch scope. Creating a pool here is a self-contained CLIENT-SIDE
 * flow against the deployed own UniswapV2 stack — NO backend, NO contracts to deploy
 * (v2 factory / Router02 / WETH already live on Robinhood), NO Permit2 (the v2 Router
 * pulls tokens via a plain ERC-20 allowance). See `~/terminal/pools/useCreateV2Pool`.
 *
 * This REPLACES the old v3 hand-off (which navigated to the backend `/positions/create/v3`
 * flow that this fork can't serve). HookSwap ships v2 + v3, but in-app creation is v2 —
 * full-range, fixed 0.30% fee — so the v3-only range-band + fee-tier selectors are gone.
 *
 * DATA POLICY (no mock data — handoff hard rule):
 *   • Base picker — LIVE from the active chain's static common-bases (`COMMON_BASES`,
 *     the same source Swap uses), enriched with the hosted `useListTokens` feed where a
 *     backend indexes the chain. Always covers Robinhood (ETH / WETH / USDG / tHOOK).
 *   • Project token — resolved by REAL on-chain reads (symbol / decimals / balance) of
 *     the pasted address; never fabricated.
 *   • First-LP detection + opening price — REAL: `factory.getPair` + the deposit ratio.
 *     No fake pool stats. The new pool auto-appears in Markets via the data-api factory
 *     enumeration once seeded (no extra wiring here).
 *   • Approve → Create — REAL writes (wagmi), gated behind the required ERC-20 allowance.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useReadContract, useReadContracts } from 'wagmi'
import { COMMON_BASES } from 'uniswap/src/constants/routing'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { erc20Abi, formatUnits, isAddress } from '~/chains'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { ExploreContextProvider } from '~/features/Explore/state'
import { ExploreTablesFilterStoreContextProvider } from '~/features/Explore/state/exploreTablesFilterStore'
import { useListTokens } from '~/features/Explore/state/listTokens/useListTokens'
import { useAccount } from '~/hooks/useAccount'
import { getPoolAddresses } from '~/terminal/pools/addresses'
import { useCreateV2Pool } from '~/terminal/pools/useCreateV2Pool'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'
import { assume0xAddress } from '~/utils/wagmi'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

/** v2 pools are a single fixed fee tier. */
const V2_FEE_LABEL = '0.30%'

/* ------------------------------------------------------------------ data model */

interface TokenOption {
  symbol: string
  logoUrl?: string
  price?: number
  // Real on-chain identity from the token registry (never fabricated): `address` is the
  // token's on-chain address, or the NATIVE sentinel (`NATIVE_CHAIN_ID`) for native ETH.
  address?: string
  chainId?: UniverseChainId
  decimals?: number
}

/* ------------------------------------------------------------------ helpers */

function sanitizeNumberInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, '')
  const first = cleaned.indexOf('.')
  if (first === -1) {
    return cleaned
  }
  return cleaned.slice(0, first + 1) + cleaned.slice(first + 1).replace(/\./g, '')
}

function toNum(raw: string): number {
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

function fmtPrice(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: value >= 1 ? 4 : 8,
  })
}

function shortAddr(a?: string): string {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—'
}

/* ------------------------------------------------------------------ token select */

function TokenCircle({ token, size = 22 }: { token?: TokenOption; size?: number }): JSX.Element {
  const [erroredUrl, setErroredUrl] = useState<string | undefined>(undefined)
  const logoUrl = token?.logoUrl
  if (logoUrl && logoUrl !== erroredUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        style={{ borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
        onError={() => setErroredUrl(logoUrl)}
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
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
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
                  <span style={{ fontFamily: MONO, fontSize: 11.5, color: terminalColors.ink3Alt }}>${fmtPrice(token.price)}</span>
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
      {note ? <span style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt }}>{note}</span> : null}
    </div>
  )
}

function SummaryRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0' }}>
      <span style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink3Alt }}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: valueColor ?? terminalColors.ink }}>{value}</span>
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

function FieldLabel({ children }: { children: React.ReactNode }): JSX.Element {
  return <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt, marginBottom: 5 }}>{children}</div>
}

/** A soft informational callout (first-LP / opening-price / Phase-2 notices). */
function Notice({ tone = 'neutral', children }: { tone?: 'neutral' | 'green' | 'muted'; children: React.ReactNode }): JSX.Element {
  const border =
    tone === 'green' ? terminalColors.greenBorder : tone === 'muted' ? terminalColors.line : terminalColors.line
  const bg = tone === 'green' ? terminalColors.greenBg : terminalColors.panel
  const color = tone === 'green' ? terminalColors.greenDeep : terminalColors.ink2
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 12,
        lineHeight: 1.5,
        color,
        background: bg,
        border: `1px ${tone === 'muted' ? 'dashed' : 'solid'} ${border}`,
        borderRadius: 11,
        padding: '10px 12px',
      }}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ deposit field */

function DepositField({
  token,
  amount,
  onChange,
  usd,
  balanceLabel,
}: {
  token?: TokenOption
  amount: string
  onChange: (v: string) => void
  usd?: string
  balanceLabel?: string
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
          <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: terminalColors.ink }}>{token?.symbol ?? '—'}</span>
        </span>
        {balanceLabel ? (
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: terminalColors.faint }}>{balanceLabel}</span>
        ) : null}
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
        {usd ? <span style={{ fontFamily: MONO, fontSize: 11, color: terminalColors.ink3Alt, flexShrink: 0 }}>{usd}</span> : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ the screen */

function PoolsScreenBody(): JSX.Element {
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const { topTokens, isLoading: tokensLoading } = useListTokens(undefined)

  // Active chain — connected wallet's chain, defaulting to Robinhood (the Terminal's live
  // chain) when disconnected, mirroring SwapScreen.
  const chainId = account.chainId ?? UniverseChainId.Robinhood
  const connected = Boolean(account.address)
  const owner = assume0xAddress(account.address)

  const poolAddrs = getPoolAddresses(chainId)
  const chainReady = Boolean(poolAddrs)
  const wrappedNative = chainId ? WRAPPED_NATIVE_CURRENCY[chainId] : undefined

  // Base token options (dedup by symbol). PRIMARY: the active chain's static common-bases
  // (always populated for HookSwap chains). SECONDARY: the hosted `topTokens` feed enriches
  // with live prices/logos on chains a backend indexes.
  const options: TokenOption[] = useMemo(() => {
    const bySymbol = new Map<string, TokenOption>()
    for (const info of COMMON_BASES[chainId] ?? []) {
      const { currency } = info
      const symbol = currency.symbol
      if (!symbol || bySymbol.has(symbol)) {
        continue
      }
      bySymbol.set(symbol, {
        symbol,
        logoUrl: info.logoUrl ?? undefined,
        address: currency.isNative ? NATIVE_CHAIN_ID : currency.address,
        chainId: currency.chainId as UniverseChainId,
        decimals: currency.decimals,
      })
    }
    for (const token of topTokens) {
      if (!token.symbol) {
        continue
      }
      const chainToken = token.chainTokens.find((ct) => ct.chainId === chainId)
      const existing = bySymbol.get(token.symbol)
      if (existing) {
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
        address: chainToken?.address,
        chainId: chainToken ? (chainToken.chainId as UniverseChainId) : undefined,
        decimals: chainToken?.decimals,
      })
    }
    // Only bases we can actually pair against (native, or a known on-chain address + decimals).
    return Array.from(bySymbol.values())
      .filter((o) => o.address === NATIVE_CHAIN_ID || (Boolean(o.address) && o.decimals !== undefined))
      .slice(0, 50)
  }, [topTokens, chainId])

  const [base, setBase] = useState<TokenOption | undefined>()
  // Default base to native ETH / WETH once options load.
  const resolvedBase =
    base ?? options.find((o) => o.address === NATIVE_CHAIN_ID) ?? options.find((o) => o.symbol === 'WETH') ?? options[0]

  // Preselect the base from a Market-Detail "Add liquidity" deep-link (?token0=SYM). Runs
  // once after options load; never clobbers a later manual pick.
  const [searchParams] = useSearchParams()
  const didSeed = useRef(false)
  useEffect(() => {
    if (didSeed.current || options.length === 0) {
      return
    }
    const sym = searchParams.get('token0') ?? searchParams.get('token1')
    if (sym) {
      const found = options.find((o) => o.symbol.toUpperCase() === sym.toUpperCase())
      if (found) {
        setBase(found)
      }
    }
    didSeed.current = true
  }, [options, searchParams])

  // Project token — resolved from a pasted address by REAL on-chain reads.
  const [projectAddr, setProjectAddr] = useState('')
  const projValid = isAddress(projectAddr)
  const projectAddr0x = assume0xAddress(projValid ? projectAddr : undefined)

  const projectMeta = useReadContracts({
    contracts: [
      { address: projectAddr0x, chainId, abi: erc20Abi, functionName: 'symbol' as const },
      { address: projectAddr0x, chainId, abi: erc20Abi, functionName: 'decimals' as const },
    ],
    query: { enabled: projValid },
  })
  const symbolEntry = projectMeta.data?.[0]
  const decimalsEntry = projectMeta.data?.[1]
  const projectSymbol = symbolEntry?.status === 'success' ? (symbolEntry.result as string) : undefined
  const projectDecimals = decimalsEntry?.status === 'success' ? Number(decimalsEntry.result) : undefined
  const projectResolveError = projValid && projectMeta.isError
  const projectResolved = projValid && projectSymbol !== undefined && projectDecimals !== undefined

  const projectBalanceRead = useReadContract({
    address: projectAddr0x,
    chainId,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: owner ? [owner] : undefined,
    query: { enabled: projValid && Boolean(owner) },
  })
  const projectBalance = projectBalanceRead.data as bigint | undefined

  const [baseAmount, setBaseAmount] = useState('')
  const [projectAmount, setProjectAmount] = useState('')

  const baseIsNative = resolvedBase?.address === NATIVE_CHAIN_ID

  const create = useCreateV2Pool({
    chainId,
    owner,
    base: { address: resolvedBase?.address, decimals: resolvedBase?.decimals, symbol: resolvedBase?.symbol },
    project: { address: projValid ? projectAddr : undefined, decimals: projectDecimals, symbol: projectSymbol },
    baseAmount,
    projectAmount,
  })

  // Opening price = deposit ratio (only shown on the first-LP path, where it's meaningful).
  const bAmt = toNum(baseAmount)
  const pAmt = toNum(projectAmount)
  const projPerBase = bAmt > 0 && pAmt > 0 ? pAmt / bAmt : undefined
  const basePerProj = bAmt > 0 && pAmt > 0 ? bAmt / pAmt : undefined

  const baseUsd =
    resolvedBase?.price && bAmt > 0 ? convertFiatAmountFormatted(bAmt * resolvedBase.price, NumberType.PortfolioBalance) : undefined
  const depositUsd = resolvedBase?.price ? bAmt * resolvedBase.price : 0

  const projectOption: TokenOption | undefined = projValid
    ? { symbol: projectSymbol ?? shortAddr(projectAddr), address: projectAddr, decimals: projectDecimals }
    : undefined

  const projectBalanceLabel =
    projectBalance !== undefined && projectDecimals !== undefined
      ? `Bal ${Number(formatUnits(projectBalance, projectDecimals)).toLocaleString('en-US', { maximumFractionDigits: 4 })}`
      : undefined

  /* --------------------------------------------------------------- primary action */

  const busy = create.isWritePending || create.baseApproving || create.projectApproving || create.isConfirming

  const onPrimary = (): void => {
    if (!connected) {
      accountDrawer.open()
      return
    }
    if (create.isDone) {
      // Start another pool.
      create.reset()
      setBaseAmount('')
      setProjectAmount('')
      setProjectAddr('')
      return
    }
    if (create.needsProjectApproval) {
      void create.approveProject()
      return
    }
    if (create.needsBaseApproval) {
      void create.approveBase()
      return
    }
    void create.create()
  }

  const primaryLabel = ((): string => {
    if (!chainReady) {
      return 'Not available on this network'
    }
    if (!connected) {
      return 'Connect wallet to create a pool'
    }
    if (create.isDone) {
      return 'Create another pool'
    }
    if (create.existingLiquidity) {
      return 'Pool already exists'
    }
    if (!create.inputsValid) {
      return 'Enter token & amounts'
    }
    if (create.projectApproving || create.baseApproving) {
      return 'Approving…'
    }
    if (create.isWritePending) {
      return 'Confirm in wallet…'
    }
    if (create.isConfirming) {
      return 'Creating pool…'
    }
    if (create.needsProjectApproval) {
      return `Approve ${projectSymbol ?? 'token'}`
    }
    if (create.needsBaseApproval) {
      return `Approve ${resolvedBase?.symbol ?? 'token'}`
    }
    return 'Create pool & add liquidity'
  })()

  const primaryDisabled = ((): boolean => {
    if (!chainReady) {
      return true
    }
    if (!connected) {
      return false
    }
    if (create.isDone) {
      return false
    }
    if (create.existingLiquidity || busy) {
      return true
    }
    if (create.needsProjectApproval || create.needsBaseApproval) {
      return false
    }
    return !create.canCreate
  })()

  return (
    <div style={{ padding: '20px var(--tm-gutter) 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
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
          New pool
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
          v2 · full range · {V2_FEE_LABEL}
        </span>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink2, marginBottom: 18, maxWidth: 560, lineHeight: 1.5 }}>
        Create a v2 pool for your token and seed it with the first liquidity — right here, no
        deploy needed. Your deposit ratio sets the opening price.
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left: pair */}
        <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel>
            <StepLabel index="01" label="Pair" note={chainReady ? undefined : 'not available'} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <FieldLabel>Base token</FieldLabel>
                <TokenSelect value={resolvedBase} options={options} onChange={setBase} loading={tokensLoading} />
                {baseIsNative && wrappedNative ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, marginTop: 5 }}>
                    Native {resolvedBase?.symbol} is wrapped to {wrappedNative.symbol} for the pool.
                  </div>
                ) : null}
              </div>
              <div>
                <FieldLabel>Project token address</FieldLabel>
                <input
                  value={projectAddr}
                  onChange={(e) => setProjectAddr(e.target.value.trim())}
                  placeholder="0x…"
                  spellCheck={false}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    border: `1px solid ${terminalColors.line}`,
                    borderRadius: 11,
                    background: terminalColors.bg,
                    padding: '10px 12px',
                    fontFamily: MONO,
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: terminalColors.ink,
                    outline: 'none',
                  }}
                />
                {projectAddr !== '' && !projValid ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, marginTop: 5 }}>
                    Enter a valid contract address.
                  </div>
                ) : projValid && projectMeta.isLoading ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt, marginTop: 5 }}>
                    Resolving token…
                  </div>
                ) : projectResolveError ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, marginTop: 5 }}>
                    Not an ERC-20 on this network.
                  </div>
                ) : projectResolved ? (
                  <div style={{ fontFamily: MONO, fontSize: 11.5, color: terminalColors.greenDeep, marginTop: 5 }}>
                    {projectSymbol} · {projectDecimals} decimals
                  </div>
                ) : null}
              </div>
            </div>
          </Panel>

          {/* First-LP / existing-pool / opening-price notices */}
          {chainReady && projectResolved ? (
            <Panel>
              {create.existingLiquidity ? (
                <Notice tone="muted">
                  This pair already has a live pool. Adding to an existing pool (price-matched, with
                  slippage) is coming soon — for now, trade it on Swap.
                </Notice>
              ) : create.isFirstLp ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Notice tone="green">
                    You&apos;ll be the first liquidity provider. You set the starting price — the deposit
                    ratio below IS the opening price.
                  </Notice>
                  {projPerBase !== undefined && basePerProj !== undefined ? (
                    <div>
                      <SummaryRow
                        label={`1 ${resolvedBase?.symbol ?? 'base'} =`}
                        value={`${fmtPrice(projPerBase)} ${projectSymbol ?? ''}`.trim()}
                      />
                      <SummaryRow
                        label={`1 ${projectSymbol ?? 'token'} =`}
                        value={`${fmtPrice(basePerProj)} ${resolvedBase?.symbol ?? ''}`.trim()}
                      />
                    </div>
                  ) : (
                    <div style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.faint }}>
                      Enter both amounts to preview the opening price.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.ink3Alt }}>Checking pool…</div>
              )}
            </Panel>
          ) : null}
        </div>

        {/* Right: deposit + create */}
        <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel>
            <StepLabel index="02" label="Deposit" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <DepositField token={resolvedBase} amount={baseAmount} onChange={setBaseAmount} usd={baseUsd} />
              <DepositField
                token={projectOption}
                amount={projectAmount}
                onChange={setProjectAmount}
                balanceLabel={projectBalanceLabel}
              />
            </div>
          </Panel>

          <Panel>
            <SummaryRow
              label="Deposit value"
              value={depositUsd > 0 ? convertFiatAmountFormatted(depositUsd, NumberType.PortfolioBalance) : '—'}
              valueColor={depositUsd > 0 ? terminalColors.ink : terminalColors.faint}
            />
            <SummaryRow label="Fee tier" value={`${V2_FEE_LABEL} (v2)`} />
            <SummaryRow label="Range" value="Full range" />
            <SummaryRow label="Network" value={chainReady && chainId ? getChainLabel(chainId) : 'Not available'} />

            <button
              type="button"
              onClick={onPrimary}
              disabled={primaryDisabled}
              style={{
                marginTop: 12,
                width: '100%',
                fontFamily: SANS,
                fontSize: 14,
                fontWeight: 600,
                color: terminalColors.btnInk,
                background: primaryDisabled ? terminalColors.line : terminalColors.brandGreen,
                border: 'none',
                padding: '12px 0',
                borderRadius: 12,
                cursor: primaryDisabled ? 'default' : 'pointer',
              }}
            >
              {primaryLabel}
            </button>

            {create.isDone ? (
              <div style={{ marginTop: 10 }}>
                <Notice tone="green">
                  Pool created and seeded. It becomes swappable and appears in Markets once indexed.
                </Notice>
              </div>
            ) : create.error ? (
              <div style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.redDown, marginTop: 10, lineHeight: 1.5 }}>
                {create.error}
              </div>
            ) : chainReady ? (
              <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, marginTop: 10, lineHeight: 1.5 }}>
                {baseIsNative
                  ? 'Approve your project token once, then create — native is wrapped automatically. No Permit2.'
                  : 'Approve each token once, then create. Tokens are pulled by the v2 router (no Permit2).'}
              </div>
            ) : null}
          </Panel>
        </div>
      </div>
    </div>
  )
}

/**
 * B4 Pools / Create v2 pool. Wrapped in the same Explore providers the Markets screen uses
 * so the token-list query (`useListTokens`) resolves.
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
