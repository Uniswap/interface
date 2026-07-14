/**
 * HookSwap Terminal — Launchpad (InstantPoolLauncherV2): instant token launch + v3 pool seed.
 *
 * DESIGN-ONLY (not routed / address unset). Built against the REAL deployed
 * `InstantPoolLauncherV2` ABI (see `~/terminal/launchpad/abis`). One payable
 * `launch(cfg)` deploys the token, opens a Uniswap-v3 pool, and (optionally) does a
 * developer buy — all in a single transaction. Flip it live by filling the Robinhood
 * entry in `~/terminal/launchpad/addresses` and adding the nav/route lines documented there.
 *
 * DATA POLICY (no mock data — hard rule):
 *   • Launch fee — REAL on-chain read of `launchFeeWei()`; `msg.value` = fee + developerBuyWei.
 *   • Creator-share bounds — REAL reads of DEFAULT/MAX_CREATOR_SHARE_BPS.
 *   • Result (token / pool / tokenId) — read back from the contract after the tx, never invented.
 *   • My launches + pending fees — REAL reads (`getLaunch`, `pendingEth`); honest empty states.
 *   • When the launcher isn't deployed on the chain, an honest "not deployed" state renders —
 *     never a fake success.
 *
 * v3 PRICE/RANGE: `sqrtPriceX96` / `tickLower` / `tickUpper` are exposed as RAW fields
 * (power-user surface, by design) — no derived price helper is shown, so nothing is guessed.
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

/** Raw-integer input sanitizer (uint fields). */
function onlyDigits(v: string): string {
  return v.replace(/[^0-9]/g, '')
}

/** int24 fields may be negative — allow a single leading '-'. */
function onlySignedDigits(v: string): string {
  const neg = v.trim().startsWith('-')
  const digits = v.replace(/[^0-9]/g, '')
  return (neg ? '-' : '') + digits
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

/** Honest "contract not deployed on this chain" note. */
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
      Launching isn&apos;t live on {chainLabel} yet — this screen activates automatically once the InstantPoolLauncherV2
      address is set for this chain.
    </div>
  )
}

/* ------------------------------------------------------------------ initial form state */

const EMPTY_INPUT: LaunchConfigInput = {
  name: '',
  symbol: '',
  metadataUri: '',
  tokenSupply: '',
  salt: ZERO_SALT,
  sqrtPriceX96: '',
  tickLower: '',
  tickUpper: '',
  creatorShareBps: '',
  teamBps: '0',
  teamRecipient: '',
  feeRecipient: '',
  dex: '0',
  developerBuyWei: '0',
  developerBuyMinOut: '0',
  developerBuyDeadline: '0',
}

/* ------------------------------------------------------------------ my launches */

function MyLaunchesPanel({ chainId, owner }: { chainId?: number; owner?: `0x${string}` }): JSX.Element {
  const my = useMyLaunches({ chainId, owner })

  const pendingLabel =
    my.totalPending > 0n
      ? `${Number(formatUnits(my.totalPending, 18)).toLocaleString('en-US', { maximumFractionDigits: 6 })} native`
      : '0'

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
            const pending =
              l.pendingEth !== undefined && l.pendingEth > 0n
                ? `${Number(formatUnits(l.pendingEth, 18)).toLocaleString('en-US', { maximumFractionDigits: 6 })}`
                : '0'
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
                <SummaryRow label="Position #" value={String(l.tokenId)} />
                <SummaryRow
                  label="Pending fees"
                  value={pending}
                  valueColor={l.pendingEth && l.pendingEth > 0n ? terminalColors.greenDeep : terminalColors.faint}
                />
                <PrimaryButton
                  label={my.claimingToken === l.token && my.isClaiming ? 'Collecting…' : 'Collect fees'}
                  onClick={() => void my.collect(l.token)}
                  disabled={my.isClaiming || !(l.pendingEth && l.pendingEth > 0n)}
                  variant="outline"
                />
              </div>
            )
          })}

          <SummaryRow label="Total pending" value={pendingLabel} />
          <PrimaryButton
            label={my.isClaiming ? 'Withdrawing…' : 'Withdraw all pending'}
            onClick={() => void my.withdrawPending()}
            disabled={my.isClaiming || my.totalPending === 0n}
          />
        </div>
      )}

      {my.claimError ? (
        <div style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.redDown, marginTop: 10, lineHeight: 1.5 }}>
          {my.claimError}
        </div>
      ) : null}
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

  const feeLabel =
    launchState.launchFeeWei !== undefined
      ? launchState.launchFeeWei === 0n
        ? 'Free'
        : `${Number(formatUnits(launchState.launchFeeWei, 18)).toLocaleString('en-US', { maximumFractionDigits: 6 })} native`
      : '—'

  const totalValueLabel =
    launchState.totalValue !== undefined
      ? `${Number(formatUnits(launchState.totalValue, 18)).toLocaleString('en-US', { maximumFractionDigits: 6 })} native`
      : '—'

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
  const supplyValue = input.tokenSupply.trim() !== '' ? input.tokenSupply.trim() : '—'

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
          instant pool · v3
        </span>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink2, marginBottom: 18, maxWidth: 620, lineHeight: 1.5 }}>
        Deploy a token, open its Uniswap-v3 pool, and (optionally) make a developer buy — in a single transaction.
        Price and range are set with raw v3 parameters.
      </div>

      {/* Stat tiles — honest "—" when disconnected / not wired. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        <StatCard size="lg" label="Symbol" value={symbolValue} />
        <StatCard size="lg" label="Supply (raw)" value={supplyValue} />
        <StatCard size="lg" label="Launch fee" value={deployed ? feeLabel : '—'} />
        <StatCard size="lg" label="Network" value={deployed ? chainLabel : 'Not live'} valueColor={deployed ? 'up' : 'ink'} />
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
                    value={input.metadataUri}
                    onChange={(v) => set('metadataUri', v)}
                    placeholder="ipfs://… or https://…"
                    mono
                  />
                </div>
                <div>
                  <FieldLabel>Token supply (raw base units)</FieldLabel>
                  <TextField
                    value={input.tokenSupply}
                    onChange={(v) => set('tokenSupply', onlyDigits(v))}
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
              <StepLabel index="02" label="Pool (raw v3)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <FieldLabel>sqrtPriceX96 (uint160)</FieldLabel>
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
                    <FieldLabel>tickLower (int24)</FieldLabel>
                    <TextField
                      value={input.tickLower}
                      onChange={(v) => set('tickLower', onlySignedDigits(v))}
                      placeholder="-887220"
                      mono
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <FieldLabel>tickUpper (int24)</FieldLabel>
                    <TextField
                      value={input.tickUpper}
                      onChange={(v) => set('tickUpper', onlySignedDigits(v))}
                      placeholder="887220"
                      mono
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <FieldLabel>dex (uint8)</FieldLabel>
                    <TextField value={input.dex} onChange={(v) => set('dex', onlyDigits(v))} placeholder="0" mono inputMode="numeric" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <FieldLabel>
                      creatorShareBps
                      {launchState.maxCreatorShareBps !== undefined ? ` (max ${launchState.maxCreatorShareBps})` : ''}
                    </FieldLabel>
                    <TextField
                      value={input.creatorShareBps}
                      onChange={(v) => set('creatorShareBps', onlyDigits(v))}
                      placeholder={
                        launchState.defaultCreatorShareBps !== undefined ? String(launchState.defaultCreatorShareBps) : '0'
                      }
                      mono
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>

              <Notice tone="muted">
                Raw v3 parameters — `sqrtPriceX96` sets the opening price and the tick range sets the LP band. Nothing is
                derived for you here, so double-check them against your intended price.
              </Notice>
            </Panel>
          ) : null}

          {/* Advanced: salt, team split, fee recipient, developer buy */}
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
                {advanced ? '− ADVANCED' : '+ ADVANCED'}
              </div>

              {advanced ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                  <div>
                    <FieldLabel>salt (bytes32)</FieldLabel>
                    <TextField value={input.salt} onChange={(v) => set('salt', v)} placeholder={ZERO_SALT} mono />
                    <PrimaryButton label="Randomize salt" onClick={() => set('salt', randomSalt())} variant="outline" />
                  </div>
                  <div>
                    <FieldLabel>feeRecipient (address)</FieldLabel>
                    <TextField value={input.feeRecipient} onChange={(v) => set('feeRecipient', v)} placeholder="0x…" mono />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <FieldLabel>teamBps (uint16)</FieldLabel>
                      <TextField value={input.teamBps} onChange={(v) => set('teamBps', onlyDigits(v))} placeholder="0" mono />
                    </div>
                    <div style={{ flex: 2, minWidth: 0 }}>
                      <FieldLabel>teamRecipient (address)</FieldLabel>
                      <TextField
                        value={input.teamRecipient}
                        onChange={(v) => set('teamRecipient', v)}
                        placeholder="0x…"
                        mono
                      />
                    </div>
                  </div>

                  <StepLabel index="03" label="Developer buy (optional)" />
                  <div>
                    <FieldLabel>developerBuyWei (raw)</FieldLabel>
                    <TextField
                      value={input.developerBuyWei}
                      onChange={(v) => set('developerBuyWei', onlyDigits(v))}
                      placeholder="0"
                      mono
                      inputMode="numeric"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <FieldLabel>developerBuyMinOut</FieldLabel>
                      <TextField
                        value={input.developerBuyMinOut}
                        onChange={(v) => set('developerBuyMinOut', onlyDigits(v))}
                        placeholder="0"
                        mono
                        inputMode="numeric"
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <FieldLabel>developerBuyDeadline</FieldLabel>
                      <TextField
                        value={input.developerBuyDeadline}
                        onChange={(v) => set('developerBuyDeadline', onlyDigits(v))}
                        placeholder="0"
                        mono
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                  <Notice tone="muted">
                    The developer buy is executed inside the same transaction — its wei amount is added to `msg.value` on
                    top of the launch fee.
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
            <SummaryRow label="Launch fee" value={deployed ? feeLabel : '—'} />
            <SummaryRow
              label="Total msg.value"
              value={deployed ? totalValueLabel : '—'}
              valueColor={deployed ? terminalColors.ink : terminalColors.faint}
            />
            <SummaryRow label="Creator" value={connected && owner ? shortAddr(owner) : '—'} />
            <SummaryRow label="Network" value={deployed ? chainLabel : 'Not available'} />

            <PrimaryButton label={primaryLabel} onClick={onPrimary} disabled={primaryDisabled} />

            {launchState.isDone ? (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Notice tone="green">Launched — token deployed and its v3 pool is live.</Notice>
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
                One transaction: deploys the token, opens the v3 pool, and runs any developer buy. The resulting token,
                pool and position are read back from the contract.
              </div>
            ) : null}
          </Panel>

          <MyLaunchesPanel chainId={chainId} owner={owner} />
        </div>
      </div>
    </div>
  )
}
