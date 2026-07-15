/**
 * HookSwap Terminal — LaunchPad (HookOSV3Launcher): direct-to-v3 fair launch.
 *
 * Mints a token + seeds a single-sided v3 pool + registers the position in the
 * HookOSV3FeeVault — all in one tx. Creator picks DEX (Uniswap V3 / HookSwap),
 * pair token (WETH / HOOK when available), and whether to lock LP on HookSwap.
 * Fee collection (LP trading fees) goes through the vault, which splits per-dex
 * (50/50 Uniswap, 70/30 HookSwap).
 *
 * DATA POLICY (no mock data):
 *   • Fees — REAL on-chain reads (effectiveLaunchFee, quoteLaunchCost).
 *   • Result — read back from getLaunch after the tx.
 *   • My launches + pending fees — from the FeeVault; honest empty states.
 */
import { useState } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { formatUnits } from '~/chains'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { useAccount } from '~/hooks/useAccount'
import { StatCard } from '~/terminal/components/StatCard'
import { getLaunchpadAddress } from '~/terminal/launchpad/addresses'
import {
  randomSalt,
  useLaunch,
  useMyLaunches,
  useRecentLaunches,
  V3Dex,
  PairToken,
  ZERO_SALT,
  type LaunchConfigInput,
} from '~/terminal/launchpad/useLaunch'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'
import { assume0xAddress } from '~/utils/wagmi'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

/* ------------------------------------------------------------------ helpers */

function shortAddr(a?: string): string {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—'
}

function onlyDigits(v: string): string {
  return v.replace(/[^0-9]/g, '')
}

function onlySignedDigits(v: string): string {
  const neg = v.trim().startsWith('-')
  const digits = v.replace(/[^0-9]/g, '')
  return (neg ? '-' : '') + digits
}

function fmtWei(wei: bigint | undefined): string {
  if (wei === undefined) {
    return '—'
  }
  if (wei === 0n) {
    return '0'
  }
  return Number(formatUnits(wei, 18)).toLocaleString('en-US', { maximumFractionDigits: 6 })
}

/* ------------------------------------------------------------------ primitives */

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

function StepLabel({ index, label, note }: { index: string; label: string; note?: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
      <span
        style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', color: terminalColors.ink3Alt }}
      >
        {index} · {label.toUpperCase()}
      </span>
      {note ? <span style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt }}>{note}</span> : null}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }): JSX.Element {
  return <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt, marginBottom: 5 }}>{children}</div>
}

function TextField({
  value,
  onChange,
  placeholder,
  mono = false,
  maxLength,
  inputMode,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
  maxLength?: number
  inputMode?: 'text' | 'decimal' | 'numeric'
}): JSX.Element {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      spellCheck={false}
      maxLength={maxLength}
      inputMode={inputMode}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 11,
        background: terminalColors.bg,
        padding: '10px 12px',
        fontFamily: mono ? MONO : SANS,
        fontSize: 13.5,
        fontWeight: mono ? 500 : 600,
        color: terminalColors.ink,
        outline: 'none',
      }}
    />
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

function Notice({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'green' | 'muted' | 'red'
  children: React.ReactNode
}): JSX.Element {
  const border = tone === 'green' ? terminalColors.greenBorder : tone === 'red' ? terminalColors.redDown : terminalColors.line
  const bg = tone === 'green' ? terminalColors.greenBg : tone === 'red' ? terminalColors.redBg : terminalColors.panel
  const color = tone === 'green' ? terminalColors.greenDeep : tone === 'red' ? terminalColors.redDown : terminalColors.ink2
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

function PrimaryButton({
  label,
  onClick,
  disabled,
  variant = 'solid',
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'solid' | 'outline'
}): JSX.Element {
  const solid = variant === 'solid'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        marginTop: 12,
        width: '100%',
        fontFamily: SANS,
        fontSize: 14,
        fontWeight: 600,
        color: solid ? terminalColors.btnInk : terminalColors.greenDeep,
        background: solid ? (disabled ? terminalColors.line : terminalColors.brandGreen) : 'transparent',
        border: solid ? 'none' : `1px solid ${terminalColors.greenBorder}`,
        padding: '12px 0',
        borderRadius: 12,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function NotDeployedNote({ chainLabel }: { chainLabel: string }): JSX.Element {
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 12.5,
        color: terminalColors.ink3Alt,
        lineHeight: 1.5,
        border: `1px dashed ${terminalColors.line}`,
        borderRadius: 11,
        background: terminalColors.panel,
        padding: '11px 13px',
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: terminalColors.greenDeep,
          marginBottom: 6,
        }}
      >
        COMING SOON
      </div>
      Launching isn&apos;t live on {chainLabel} yet — this screen activates automatically once the launcher is deployed.
    </div>
  )
}

/** Pill-style toggle group for DEX / pair / lockOnHookSwap selectors. */
function ToggleRow({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[]
  value: string
  onChange: (v: string) => void
}): JSX.Element {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 600,
              color: active ? terminalColors.greenDeep : terminalColors.ink3Alt,
              background: active ? terminalColors.greenBg : 'transparent',
              border: `1px solid ${active ? terminalColors.greenBorder : terminalColors.line}`,
              borderRadius: 8,
              padding: '6px 14px',
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ initial form state */

const EMPTY_INPUT: LaunchConfigInput = {
  name: '',
  symbol: '',
  metadataURI: '',
  totalSupply: '',
  salt: ZERO_SALT,
  sqrtPriceX96: '',
  tickLower: '',
  tickUpper: '',
  dex: String(V3Dex.HookSwap),
  pair: String(PairToken.WETH),
  lockOnHookSwap: true,
  initialBuyEth: '0',
  initialBuyMinOut: '0',
  initialBuyDeadline: '0',
}

/* ------------------------------------------------------------------ my launches */

function MyLaunchesPanel({ chainId, owner }: { chainId?: number; owner?: `0x${string}` }): JSX.Element {
  const my = useMyLaunches({ chainId, owner })

  return (
    <Panel>
      <StepLabel index="04" label="My launches" note={my.isLoading ? 'loading…' : undefined} />

      {!owner ? (
        <Notice tone="muted">Connect your wallet to see the tokens you&apos;ve launched.</Notice>
      ) : my.isLoading ? (
        <Notice tone="muted">Loading your launches…</Notice>
      ) : my.launches.length === 0 ? (
        <Notice tone="muted">You haven&apos;t launched any tokens yet.</Notice>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {my.launches.map((l) => {
            const dexLabel = l.dex === V3Dex.HookSwap ? 'HookSwap' : 'Uniswap V3'
            return (
              <div
                key={String(l.id)}
                style={{
                  border: `1px solid ${terminalColors.line}`,
                  borderRadius: 11,
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <SummaryRow label="Token" value={shortAddr(l.token)} />
                <SummaryRow label="Pool" value={shortAddr(l.pool)} />
                <SummaryRow label="DEX" value={dexLabel} />
                <SummaryRow label="Position #" value={String(l.tokenId)} />
                <SummaryRow
                  label="Pending WETH"
                  value={fmtWei(l.pendingWeth)}
                  valueColor={l.pendingWeth && l.pendingWeth > 0n ? terminalColors.greenDeep : terminalColors.faint}
                />
                <SummaryRow
                  label="Pending token"
                  value={fmtWei(l.pendingToken)}
                  valueColor={l.pendingToken && l.pendingToken > 0n ? terminalColors.greenDeep : terminalColors.faint}
                />
                <PrimaryButton
                  label={my.claimingToken === l.token && my.isClaiming ? 'Collecting…' : 'Collect fees'}
                  onClick={() => void my.collect(l.token)}
                  disabled={my.isClaiming || !((l.pendingWeth && l.pendingWeth > 0n) || (l.pendingToken && l.pendingToken > 0n))}
                  variant="outline"
                />
              </div>
            )
          })}

          <SummaryRow label="Total pending WETH" value={fmtWei(my.totalPendingWeth)} />
          {my.deferredEth > 0n ? (
            <>
              <SummaryRow
                label="Deferred ETH"
                value={fmtWei(my.deferredEth)}
                valueColor={terminalColors.greenDeep}
              />
              <PrimaryButton
                label={my.isClaiming ? 'Withdrawing…' : 'Withdraw deferred ETH'}
                onClick={() => void my.withdrawPending()}
                disabled={my.isClaiming}
              />
            </>
          ) : null}
        </div>
      )}

      {my.claimError ? (
        <div style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.redDown, marginTop: 10, lineHeight: 1.5 }}>
          {my.claimError}
        </div>
      ) : null}

      <div style={{ fontFamily: SANS, fontSize: 10.5, color: terminalColors.faint, marginTop: 10, lineHeight: 1.5 }}>
        LP is permanently locked in the fee vault. Trading fees are split per-dex (50/50 Uniswap V3, 70/30 HookSwap).
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------ recent launches (public) */

function timeAgo(unixSec: bigint): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - Number(unixSec)
  if (diff < 60) {
    return 'just now'
  }
  if (diff < 3600) {
    return `${Math.floor(diff / 60)}m ago`
  }
  if (diff < 86400) {
    return `${Math.floor(diff / 3600)}h ago`
  }
  return `${Math.floor(diff / 86400)}d ago`
}

function RecentLaunchesPanel({ chainId }: { chainId?: number }): JSX.Element {
  const recent = useRecentLaunches({ chainId, limit: 20 })

  return (
    <Panel>
      <StepLabel index="05" label="Recent launches" note={recent.isLoading ? 'loading…' : `${recent.launches.length} total`} />

      {recent.isLoading ? (
        <Notice tone="muted">Loading recent launches…</Notice>
      ) : recent.launches.length === 0 ? (
        <Notice tone="muted">No tokens launched yet — be the first.</Notice>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recent.launches.map((l) => (
            <a
              key={String(l.id)}
              href={`https://robinscan.io/address/${l.token}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: `1px solid ${terminalColors.line}`,
                borderRadius: 10,
                padding: '8px 10px',
                textDecoration: 'none',
                gap: 8,
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 500, color: terminalColors.brandGreen }}>
                {shortAddr(l.token)}
              </span>
              <span style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt }}>
                {l.dex === V3Dex.HookSwap ? 'HookSwap' : 'UniV3'}
              </span>
              <span style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, marginLeft: 'auto' }}>
                {timeAgo(l.createdAt)}
              </span>
            </a>
          ))}
        </div>
      )}
    </Panel>
  )
}

/* ------------------------------------------------------------------ the screen */

export function LaunchScreen(): JSX.Element {
  const account = useAccount()
  const accountDrawer = useAccountDrawer()

  const chainId = account.chainId ?? UniverseChainId.Robinhood
  const connected = Boolean(account.address)
  const owner = assume0xAddress(account.address)

  const launcher = getLaunchpadAddress(chainId)
  const deployed = Boolean(launcher)
  const chainLabel = getChainLabel(chainId)

  const [input, setInput] = useState<LaunchConfigInput>(EMPTY_INPUT)
  const [advanced, setAdvanced] = useState(false)

  const set = <K extends keyof LaunchConfigInput>(key: K, value: LaunchConfigInput[K]): void => {
    setInput((prev) => ({ ...prev, [key]: value }))
  }

  const launchState = useLaunch({ chainId, owner, input })

  const feeLabel = launchState.baseFeeWei !== undefined ? `${fmtWei(launchState.baseFeeWei)} ETH` : '—'
  const totalValueLabel = launchState.totalValue !== undefined ? `${fmtWei(launchState.totalValue)} ETH` : '—'

  const busy = launchState.isWritePending || launchState.isConfirming

  const onPrimary = (): void => {
    if (!connected) {
      accountDrawer.open()
      return
    }
    if (launchState.isDone) {
      launchState.reset()
      setInput(EMPTY_INPUT)
      return
    }
    void launchState.launch()
  }

  const primaryLabel = ((): string => {
    if (!deployed) {
      return 'Not available on this network'
    }
    if (!connected) {
      return 'Connect wallet to launch'
    }
    if (launchState.isDone) {
      return 'Launch another token'
    }
    if (launchState.validationError) {
      return launchState.validationError
    }
    if (launchState.isWritePending) {
      return 'Confirm in wallet…'
    }
    if (launchState.isConfirming) {
      return 'Launching…'
    }
    return 'Launch token'
  })()

  const primaryDisabled = ((): boolean => {
    if (!deployed) {
      return true
    }
    if (!connected) {
      return false
    }
    if (launchState.isDone) {
      return false
    }
    if (busy) {
      return true
    }
    return !launchState.canLaunch
  })()

  const symbolValue = input.symbol.trim() !== '' ? input.symbol.trim().toUpperCase() : '—'
  const supplyValue = input.totalSupply.trim() !== '' ? input.totalSupply.trim() : '—'
  const dexLabel = input.dex === String(V3Dex.HookSwap) ? 'HookSwap' : 'Uniswap V3'

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
          Launch
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
          fair launch · v3
        </span>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink2, marginBottom: 18, maxWidth: 620, lineHeight: 1.5 }}>
        Deploy a token, seed its v3 pool, and lock the LP — in a single transaction. Pick your DEX, pair token, and
        optionally make an initial buy.
      </div>

      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        <StatCard size="lg" label="Symbol" value={symbolValue} />
        <StatCard size="lg" label="Supply (raw)" value={supplyValue} />
        <StatCard size="lg" label="Launch fee" value={deployed ? feeLabel : '—'} />
        <StatCard size="lg" label="DEX" value={deployed ? dexLabel : '—'} />
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left: the launch config */}
        <div style={{ flex: '1 1 380px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel>
            <StepLabel index="01" label="Token" note={deployed ? undefined : 'not deployed'} />
            {!deployed ? (
              <NotDeployedNote chainLabel={chainLabel} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <FieldLabel>Name</FieldLabel>
                  <TextField value={input.name} onChange={(v) => set('name', v)} placeholder="My Token" maxLength={64} />
                </div>
                <div>
                  <FieldLabel>Symbol</FieldLabel>
                  <TextField
                    value={input.symbol}
                    onChange={(v) => set('symbol', v.toUpperCase())}
                    placeholder="MYT"
                    mono
                    maxLength={16}
                  />
                </div>
                <div>
                  <FieldLabel>Metadata URI</FieldLabel>
                  <TextField
                    value={input.metadataURI}
                    onChange={(v) => set('metadataURI', v)}
                    placeholder="ipfs://… or https://…"
                    mono
                  />
                </div>
                <div>
                  <FieldLabel>Token supply (raw base units)</FieldLabel>
                  <TextField
                    value={input.totalSupply}
                    onChange={(v) => set('totalSupply', onlyDigits(v))}
                    placeholder="1000000000000000000000000"
                    mono
                    inputMode="numeric"
                  />
                </div>
              </div>
            )}
          </Panel>

          {deployed ? (
            <Panel>
              <StepLabel index="02" label="Pool" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <FieldLabel>DEX</FieldLabel>
                  <ToggleRow
                    options={[
                      { label: 'HookSwap', value: String(V3Dex.HookSwap) },
                      { label: 'Uniswap V3', value: String(V3Dex.UniswapV3) },
                    ]}
                    value={input.dex}
                    onChange={(v) => set('dex', v)}
                  />
                </div>
                <div>
                  <FieldLabel>Pair token</FieldLabel>
                  <ToggleRow
                    options={[
                      { label: 'WETH', value: String(PairToken.WETH) },
                      ...(launchState.hookPairEnabled ? [{ label: 'HOOK', value: String(PairToken.HOOK) }] : []),
                    ]}
                    value={input.pair}
                    onChange={(v) => set('pair', v)}
                  />
                </div>
                <div>
                  <FieldLabel>Lock LP permanently</FieldLabel>
                  <ToggleRow
                    options={[
                      { label: 'Yes — lock', value: 'true' },
                      { label: 'No', value: 'false' },
                    ]}
                    value={String(input.lockOnHookSwap)}
                    onChange={(v) => set('lockOnHookSwap', v === 'true')}
                  />
                </div>
              </div>
              <Notice tone="muted">
                Pool is single-sided (100% your token), paired against {input.pair === String(PairToken.HOOK) ? 'HOOK' : 'WETH'}.
                LP is locked in the fee vault — trading fees are claimable.
              </Notice>
            </Panel>
          ) : null}

          {/* Advanced: v3 price params, salt, initial buy */}
          {deployed ? (
            <Panel>
              <div
                onClick={() => setAdvanced((a) => !a)}
                style={{
                  cursor: 'pointer',
                  fontFamily: MONO,
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: terminalColors.ink3Alt,
                }}
              >
                {advanced ? '− ADVANCED' : '+ ADVANCED (price, salt, initial buy)'}
              </div>

              {advanced ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                  <StepLabel index="03" label="Price & range" />
                  <div>
                    <FieldLabel>Initial price (sqrtPriceX96)</FieldLabel>
                    <TextField
                      value={input.sqrtPriceX96}
                      onChange={(v) => set('sqrtPriceX96', onlyDigits(v))}
                      placeholder="79228162514264337593543950336"
                      mono
                      inputMode="numeric"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <FieldLabel>Tick lower</FieldLabel>
                      <TextField
                        value={input.tickLower}
                        onChange={(v) => set('tickLower', onlySignedDigits(v))}
                        placeholder="-887220"
                        mono
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <FieldLabel>Tick upper</FieldLabel>
                      <TextField
                        value={input.tickUpper}
                        onChange={(v) => set('tickUpper', onlySignedDigits(v))}
                        placeholder="887220"
                        mono
                      />
                    </div>
                  </div>

                  <StepLabel index="04" label="Salt & initial buy" />
                  <div>
                    <FieldLabel>Deploy salt</FieldLabel>
                    <TextField
                      value={input.salt === ZERO_SALT ? '' : input.salt}
                      onChange={(v) => set('salt', v || ZERO_SALT)}
                      placeholder="Default (zero) — click Randomize for a unique address"
                      mono
                    />
                    <PrimaryButton label="Randomize salt" onClick={() => set('salt', randomSalt())} variant="outline" />
                  </div>
                  <div>
                    <FieldLabel>Initial buy amount (ETH, in wei)</FieldLabel>
                    <TextField
                      value={input.initialBuyEth}
                      onChange={(v) => set('initialBuyEth', onlyDigits(v))}
                      placeholder="0"
                      mono
                      inputMode="numeric"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <FieldLabel>Min tokens received</FieldLabel>
                      <TextField
                        value={input.initialBuyMinOut}
                        onChange={(v) => set('initialBuyMinOut', onlyDigits(v))}
                        placeholder="0"
                        mono
                        inputMode="numeric"
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <FieldLabel>Deadline (unix timestamp)</FieldLabel>
                      <TextField
                        value={input.initialBuyDeadline}
                        onChange={(v) => set('initialBuyDeadline', onlyDigits(v))}
                        placeholder="0"
                        mono
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                  <Notice tone="muted">
                    Initial buy executes in the same tx. Its ETH is added to the total cost.
                  </Notice>
                </div>
              ) : null}
            </Panel>
          ) : null}
        </div>

        {/* Right: review + launch + my launches */}
        <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel>
            <SummaryRow label="Name" value={input.name.trim() !== '' ? input.name.trim() : '—'} />
            <SummaryRow label="Symbol" value={symbolValue} />
            <SummaryRow label="Supply (raw)" value={supplyValue} />
            <SummaryRow label="DEX" value={deployed ? dexLabel : '—'} />
            <SummaryRow label="Launch fee" value={deployed ? feeLabel : '—'} />
            <SummaryRow
              label="Total cost"
              value={deployed ? totalValueLabel : '—'}
              valueColor={deployed ? terminalColors.ink : terminalColors.faint}
            />
            <SummaryRow label="Creator" value={connected && owner ? shortAddr(owner) : '—'} />
            <SummaryRow label="Network" value={deployed ? chainLabel : 'Not available'} />

            <PrimaryButton label={primaryLabel} onClick={onPrimary} disabled={primaryDisabled} />

            {launchState.isDone ? (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Notice tone="green">Launched — token deployed, pool seeded, LP locked in the fee vault.</Notice>
                <SummaryRow label="Token" value={shortAddr(launchState.createdToken)} />
                <SummaryRow label="Pool" value={shortAddr(launchState.createdPool)} />
                <SummaryRow
                  label="Position #"
                  value={launchState.createdTokenId !== undefined ? String(launchState.createdTokenId) : '—'}
                />
              </div>
            ) : launchState.error ? (
              <div style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.redDown, marginTop: 10, lineHeight: 1.5 }}>
                {launchState.error}
              </div>
            ) : deployed ? (
              <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, marginTop: 10, lineHeight: 1.5 }}>
                One transaction: deploys the token, seeds the v3 pool, and registers the LP position in the fee vault.
                Principal is locked forever; trading fees are claimable below.
              </div>
            ) : null}
          </Panel>

          <MyLaunchesPanel chainId={chainId} owner={owner} />
          <RecentLaunchesPanel chainId={chainId} />
        </div>
      </div>
    </div>
  )
}
