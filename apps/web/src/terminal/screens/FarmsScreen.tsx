/**
 * HookSwap Terminal — Farms (create staking farms + stake/claim/unstake).
 *
 * Robinhood-only launch scope. Two tabs:
 *   • "Create farm"   — StakingRewardsFactory `createAndFund(stakingToken, rewardToken,
 *                       rewardAmount, duration)`: deploys a funded `StakingRewards` child that
 *                       streams the reward token to stakers over the chosen duration.
 *   • "Stake / manage"— pick (or paste) a farm and stake the staking token, claim rewards, or
 *                       unstake — all real on-chain reads/writes.
 *
 * DATA POLICY (facts-only, no fabricated data — handoff hard rule):
 *   • The factory address is config-driven (`~/terminal/farms/addresses.ts`). Until it is
 *     deployed on a chain the screen renders an honest "Farms aren't live on {chain} yet" state
 *     — never an error, never mock data.
 *   • Every token symbol/decimals, farm balance, reward rate, period end and the farm registry
 *     are REAL on-chain reads. They read "—" until they resolve.
 *   • `createAndFund` PULLS the reward budget via `transferFrom`, and `stake` pulls the staking
 *     token the same way — so both are GATED behind a live ERC-20 allowance: the button stays
 *     "Approve" until the approval is CONFIRMED on-chain, so a user can never sign a tx that
 *     would revert for a missing allowance.
 *   • APR is NEVER fabricated. Robinhood has no USD anchor pool yet, so there is no price to
 *     turn a token-per-second reward rate into a % yield. The UI shows the reward rate, staked
 *     amounts and period in TOKEN terms plus an honest "APR needs a USD anchor" note.
 *
 * Contract signatures: see `~/terminal/farms/abis.ts`
 * (`contracts/farms/src/StakingRewardsFactory.sol` + `StakingRewards.sol`).
 */
import { useState } from 'react'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { formatUnits, type Address } from '~/chains'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { useAccount } from '~/hooks/useAccount'
import { StatCard } from '~/terminal/components/StatCard'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'
import { getFarmFactory } from '~/terminal/farms/addresses'
import { useCreateFarm } from '~/terminal/farms/useCreateFarm'
import { useFarm, useFarmList } from '~/terminal/farms/useFarm'
import { assume0xAddress } from '~/utils/wagmi'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

type FarmsTab = 'create' | 'manage'

/* ------------------------------------------------------------------ helpers */

const SECONDS_PER_DAY = 86_400

function shortAddr(a?: string): string {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—'
}

/** Whole days string → seconds, or undefined when empty/invalid. */
function daysToSeconds(value: string): number | undefined {
  if (value === '') {
    return undefined
  }
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) {
    return undefined
  }
  return Math.floor(n * SECONDS_PER_DAY)
}

/** Seconds → a compact human label (e.g. "2y 6mo", "14d", "3h"). */
function fmtDuration(seconds: number): string {
  if (seconds <= 0) {
    return '0'
  }
  const years = Math.floor(seconds / 31_536_000)
  const afterYears = seconds - years * 31_536_000
  const months = Math.floor(afterYears / 2_592_000)
  const afterMonths = afterYears - months * 2_592_000
  const days = Math.floor(afterMonths / SECONDS_PER_DAY)
  const parts: string[] = []
  if (years > 0) {
    parts.push(`${years}y`)
  }
  if (months > 0) {
    parts.push(`${months}mo`)
  }
  if (days > 0) {
    parts.push(`${days}d`)
  }
  if (parts.length === 0) {
    const hours = Math.floor(seconds / 3600)
    if (hours > 0) {
      return `${hours}h`
    }
    const mins = Math.floor(seconds / 60)
    return mins > 0 ? `${mins}m` : `${seconds}s`
  }
  return parts.join(' ')
}

/** Raw token units → a readable amount using the token's real decimals ("—" until known). */
function fmtAmount(raw?: bigint, decimals?: number): string {
  if (raw === undefined || decimals === undefined) {
    return '—'
  }
  const n = Number(formatUnits(raw, decimals))
  if (!Number.isFinite(n)) {
    return '—'
  }
  return n.toLocaleString('en-US', { maximumFractionDigits: 6 })
}

/* ------------------------------------------------------------------ primitives (mirror VestingScreen) */

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
      <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', color: terminalColors.ink3Alt }}>
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
  mono = true,
  inputMode,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
  inputMode?: 'text' | 'decimal' | 'numeric'
}): JSX.Element {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      spellCheck={false}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 11,
        background: terminalColors.bg,
        padding: '10px 12px',
        fontFamily: mono ? MONO : SANS,
        fontSize: 13.5,
        fontWeight: 500,
        color: terminalColors.ink,
        outline: 'none',
      }}
    />
  )
}

function SummaryRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', gap: 12 }}>
      <span style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink3Alt, whiteSpace: 'nowrap' }}>{label}</span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 12.5,
          fontWeight: 500,
          color: valueColor ?? terminalColors.ink,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function Notice({ tone = 'neutral', children }: { tone?: 'neutral' | 'green' | 'muted' | 'red'; children: React.ReactNode }): JSX.Element {
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

function PrimaryButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }): JSX.Element {
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
        color: terminalColors.btnInk,
        background: disabled ? terminalColors.line : terminalColors.brandGreen,
        border: 'none',
        padding: '12px 0',
        borderRadius: 12,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {label}
    </button>
  )
}

/** A secondary (outline) action button, used for Claim / Unstake alongside the primary stake CTA. */
function SecondaryButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        fontFamily: SANS,
        fontSize: 13.5,
        fontWeight: 600,
        color: disabled ? terminalColors.faint : terminalColors.greenDeep,
        background: disabled ? terminalColors.panel : terminalColors.greenBg,
        border: `1px solid ${disabled ? terminalColors.line : terminalColors.greenBorder}`,
        padding: '11px 0',
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
      Farms aren&apos;t live on {chainLabel} yet — this panel activates automatically once the HookSwap staking-rewards
      factory is deployed.
    </div>
  )
}

function ConnectInline({ text, onConnect }: { text: string; onConnect: () => void }): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, padding: '10px 0' }}>
      <div style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink2 }}>{text}</div>
      <button
        type="button"
        onClick={onConnect}
        style={{
          fontFamily: SANS,
          fontSize: 13,
          fontWeight: 600,
          color: terminalColors.btnInk,
          background: terminalColors.brandGreen,
          border: 'none',
          padding: '9px 18px',
          borderRadius: 11,
          cursor: 'pointer',
        }}
      >
        Connect wallet
      </button>
    </div>
  )
}

/** Honest note: APR needs a USD price for both tokens, unavailable on Robinhood pre-anchor. */
function AprNote(): JSX.Element {
  return (
    <Notice tone="muted">
      APR is shown once a USD anchor pool is live — until then this farm reports its reward rate and staked amounts in
      token terms only (no fabricated yield %).
    </Notice>
  )
}

/* ------------------------------------------------------------------ create tab */

function CreateTab({
  deployed,
  chainLabel,
  chainId,
  owner,
  connected,
  onConnect,
}: {
  deployed: boolean
  chainLabel: string
  chainId?: number
  owner: Address | undefined
  connected: boolean
  onConnect: () => void
}): JSX.Element {
  const [stakingToken, setStakingToken] = useState('')
  const [rewardToken, setRewardToken] = useState('')
  const [rewardAmount, setRewardAmount] = useState('')
  const [durationDays, setDurationDays] = useState('30')

  const durationSeconds = daysToSeconds(durationDays)

  const farm = useCreateFarm({
    chainId,
    owner,
    stakingToken,
    rewardToken,
    rewardAmount,
    durationSeconds,
  })

  const onPrimary = (): void => {
    if (!connected) {
      onConnect()
      return
    }
    if (farm.isDone) {
      farm.reset()
      setRewardAmount('')
      return
    }
    void (farm.needsApproval ? farm.approve() : farm.create())
  }

  const primaryLabel = ((): string => {
    if (!deployed) {
      return 'Not available on this network'
    }
    if (!connected) {
      return 'Connect wallet to create a farm'
    }
    if (farm.isDone) {
      return 'Create another farm'
    }
    if (!farm.inputsValid) {
      return 'Enter stake token, reward token, amount & duration'
    }
    if (!farm.allowanceKnown) {
      return 'Checking approval…'
    }
    if (farm.needsApproval) {
      if (farm.approving) {
        return 'Approving…'
      }
      return farm.isWritePending ? 'Confirm in wallet…' : 'Approve reward token'
    }
    if (farm.isWritePending) {
      return 'Confirm in wallet…'
    }
    if (farm.isConfirming) {
      return 'Creating farm…'
    }
    return 'Create farm'
  })()

  const primaryDisabled = ((): boolean => {
    if (!deployed) {
      return true
    }
    if (!connected || farm.isDone) {
      return false
    }
    return farm.needsApproval ? !farm.canApprove : !farm.canCreate
  })()

  const rewardPerDay =
    farm.rewardAmountRaw !== undefined && durationSeconds !== undefined && durationSeconds > 0
      ? (farm.rewardAmountRaw * BigInt(SECONDS_PER_DAY)) / BigInt(durationSeconds)
      : undefined

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Left: farm details */}
      <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Panel>
          <StepLabel index="01" label="Farm details" note={deployed ? undefined : 'not deployed'} />
          {!deployed ? (
            <NotDeployedNote chainLabel={chainLabel} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <FieldLabel>Staking token address (what users stake — token or LP)</FieldLabel>
                <TextField value={stakingToken} onChange={setStakingToken} placeholder="0x…" />
                {stakingToken !== '' && !farm.validStakingToken ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, marginTop: 5 }}>
                    Enter a valid ERC-20 contract address.
                  </div>
                ) : farm.stakingSymbol ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt, marginTop: 5 }}>
                    {farm.stakingSymbol}
                    {farm.stakingDecimals !== undefined ? ` · ${farm.stakingDecimals} decimals` : ''}
                  </div>
                ) : null}
              </div>

              <div>
                <FieldLabel>Reward token address (what stakers earn)</FieldLabel>
                <TextField value={rewardToken} onChange={setRewardToken} placeholder="0x…" />
                {rewardToken !== '' && !farm.validRewardToken ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, marginTop: 5 }}>
                    Enter a valid ERC-20 contract address.
                  </div>
                ) : !farm.distinctTokens ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, marginTop: 5 }}>
                    Reward token must differ from the staking token.
                  </div>
                ) : farm.rewardSymbol ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt, marginTop: 5 }}>
                    {farm.rewardSymbol}
                    {farm.rewardDecimals !== undefined ? ` · ${farm.rewardDecimals} decimals` : ''}
                  </div>
                ) : null}
              </div>

              <div>
                <FieldLabel>Total reward budget (whole {farm.rewardSymbol ?? 'reward'} tokens)</FieldLabel>
                <TextField
                  value={rewardAmount}
                  onChange={(v) => setRewardAmount(v.replace(/[^0-9.]/g, ''))}
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </div>

              <div>
                <FieldLabel>Reward duration (days)</FieldLabel>
                <TextField
                  value={durationDays}
                  onChange={(v) => setDurationDays(v.replace(/[^0-9.]/g, ''))}
                  placeholder="30"
                  inputMode="decimal"
                />
                {durationDays !== '' && (durationSeconds === undefined || durationSeconds <= 0) ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, marginTop: 5 }}>
                    Duration must be greater than zero.
                  </div>
                ) : (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt, marginTop: 5 }}>
                    Rewards stream linearly over this window from the moment the farm is created.
                  </div>
                )}
              </div>
            </div>
          )}
        </Panel>

        {deployed ? (
          <Notice tone="muted">
            The full reward budget is transferred into the farm on creation and streamed to stakers over the duration.
            You (the creator) own the farm and can extend it later; the streamed rewards can&apos;t be pulled back.
          </Notice>
        ) : null}
      </div>

      {/* Right: review + create */}
      <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Panel>
          <SummaryRow label="Staking token" value={farm.stakingSymbol ?? (farm.validStakingToken ? '…' : '—')} />
          <SummaryRow label="Reward token" value={farm.rewardSymbol ?? (farm.validRewardToken ? '…' : '—')} />
          <SummaryRow
            label="Reward budget"
            value={farm.validAmount && rewardAmount !== '' ? `${Number(rewardAmount).toLocaleString('en-US')}` : '—'}
          />
          <SummaryRow
            label="Duration"
            value={durationSeconds !== undefined && durationSeconds > 0 ? fmtDuration(durationSeconds) : '—'}
          />
          <SummaryRow
            label="Reward rate"
            value={
              rewardPerDay !== undefined
                ? `${fmtAmount(rewardPerDay, farm.rewardDecimals)} ${farm.rewardSymbol ?? ''}/day`.trim()
                : '—'
            }
          />
          <SummaryRow label="Funded by" value={connected && owner ? shortAddr(owner) : '—'} />
          <SummaryRow label="Network" value={deployed ? chainLabel : 'Not available'} />

          <PrimaryButton label={primaryLabel} onClick={onPrimary} disabled={primaryDisabled} />

          {farm.isDone ? (
            <div style={{ marginTop: 10 }}>
              <Notice tone="green">
                Farm created and funded.{farm.createdFarm ? ` Address ${shortAddr(farm.createdFarm)}.` : ''} Stakers can
                now deposit from the &ldquo;Stake / manage&rdquo; tab and earn the reward stream.
              </Notice>
            </div>
          ) : farm.error ? (
            <div style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.redDown, marginTop: 10, lineHeight: 1.5 }}>
              {farm.error}
            </div>
          ) : deployed ? (
            <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, marginTop: 10, lineHeight: 1.5 }}>
              You approve the reward token once, then create. Creating transfers the full reward budget into a new
              staking-rewards contract and starts the stream.
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ manage tab */

function FarmStat({ label, value, accent }: { label: string; value: string; accent?: boolean }): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <span style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt }}>{label}</span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 14,
          fontWeight: 600,
          color: accent ? terminalColors.greenDeep : terminalColors.ink,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function ManageTab({
  deployed,
  connected,
  chainLabel,
  chainId,
  owner,
  onConnect,
  selectedFarm,
  setSelectedFarm,
  farm,
  stakeAmount,
  setStakeAmount,
  unstakeAmount,
  setUnstakeAmount,
}: {
  deployed: boolean
  connected: boolean
  chainLabel: string
  chainId?: number
  owner: Address | undefined
  onConnect: () => void
  selectedFarm: string
  setSelectedFarm: (v: string) => void
  farm: ReturnType<typeof useFarm>
  stakeAmount: string
  setStakeAmount: (v: string) => void
  unstakeAmount: string
  setUnstakeAmount: (v: string) => void
}): JSX.Element {
  const list = useFarmList({ chainId })

  if (!deployed) {
    return (
      <Panel>
        <NotDeployedNote chainLabel={chainLabel} />
      </Panel>
    )
  }

  const now = Math.floor(Date.now() / 1000)
  const periodFinish = farm.periodFinish !== undefined ? Number(farm.periodFinish) : undefined
  const endsLabel = ((): string => {
    if (periodFinish === undefined) {
      return '—'
    }
    if (periodFinish === 0) {
      return 'Not started'
    }
    return periodFinish > now ? `in ${fmtDuration(periodFinish - now)}` : 'Ended'
  })()

  const rewardPerDay =
    farm.rewardRate !== undefined ? farm.rewardRate * BigInt(SECONDS_PER_DAY) : undefined

  const stakeLabel = ((): string => {
    if (!connected) {
      return 'Connect wallet'
    }
    if (!farm.validStake) {
      return 'Enter an amount to stake'
    }
    if (!farm.allowanceKnown) {
      return 'Checking approval…'
    }
    if (farm.needsApproval) {
      return farm.pendingAction === 'approve' ? 'Approving…' : 'Approve staking token'
    }
    if (farm.pendingAction === 'stake') {
      return 'Staking…'
    }
    return 'Stake'
  })()

  const onStakePrimary = (): void => {
    if (!connected) {
      onConnect()
      return
    }
    void (farm.needsApproval ? farm.approve() : farm.stake())
  }
  const stakeDisabled = connected && (farm.needsApproval ? !farm.canApprove : !farm.canStake)

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Left: farm picker + live stats */}
      <div style={{ flex: '1 1 360px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Panel>
          <StepLabel index="01" label="Select a farm" />
          <FieldLabel>Farm address</FieldLabel>
          <TextField value={selectedFarm} onChange={setSelectedFarm} placeholder="0x… (paste a farm address)" />
          {selectedFarm !== '' && !farm.validFarm ? (
            <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, marginTop: 5 }}>
              Enter a valid farm contract address.
            </div>
          ) : null}

          {/* Discovery list — every farm the factory has deployed (allFarms). */}
          <div style={{ marginTop: 12 }}>
            <FieldLabel>Deployed farms</FieldLabel>
            {list.isLoading || list.farms === undefined ? (
              <div style={{ fontFamily: SANS, fontSize: 12, color: terminalColors.ink3Alt }}>Loading farms…</div>
            ) : list.error ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: SANS, fontSize: 12, color: terminalColors.redDown }}>Failed to load farms.</span>
                <button
                  type="button"
                  onClick={list.refetch}
                  style={{
                    fontFamily: SANS,
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: terminalColors.ink2,
                    background: terminalColors.panel,
                    border: `1px solid ${terminalColors.line}`,
                    padding: '4px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            ) : list.farms.length === 0 ? (
              <div style={{ fontFamily: SANS, fontSize: 12, color: terminalColors.ink3Alt }}>
                No farms have been created yet — make one from the Create tab.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {list.farms.map((f) => {
                  const active = f.toLowerCase() === selectedFarm.toLowerCase()
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setSelectedFarm(f)}
                      style={{
                        fontFamily: MONO,
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: active ? terminalColors.greenDeep : terminalColors.ink2,
                        background: active ? terminalColors.greenBg : terminalColors.panel,
                        border: `1px solid ${active ? terminalColors.greenBorder : terminalColors.line}`,
                        padding: '5px 10px',
                        borderRadius: 9,
                        cursor: 'pointer',
                      }}
                    >
                      {shortAddr(f)}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </Panel>

        {farm.validFarm ? (
          <Panel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: terminalColors.ink }}>
                {farm.stakingSymbol ?? '…'}
              </span>
              <span style={{ fontFamily: SANS, fontSize: 12, color: terminalColors.ink3Alt }}>
                stake → earn {farm.rewardSymbol ?? '…'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 14 }}>
              <FarmStat label="Your stake" value={fmtAmount(farm.staked, farm.stakingDecimals)} />
              <FarmStat label="Total staked" value={fmtAmount(farm.totalStaked, farm.stakingDecimals)} />
              <FarmStat
                label="Claimable"
                value={fmtAmount(farm.earned, farm.rewardDecimals)}
                accent={farm.earned !== undefined && farm.earned > 0n}
              />
              <FarmStat
                label="Reward rate"
                value={
                  rewardPerDay !== undefined
                    ? `${fmtAmount(rewardPerDay, farm.rewardDecimals)} ${farm.rewardSymbol ?? ''}/day`.trim()
                    : '—'
                }
              />
              <FarmStat label="Period ends" value={endsLabel} />
            </div>

            <div style={{ marginTop: 16 }}>
              <AprNote />
            </div>
          </Panel>
        ) : null}
      </div>

      {/* Right: stake / claim / unstake */}
      <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Panel>
          <StepLabel index="02" label="Stake / manage" />
          {!farm.validFarm ? (
            <div style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink3Alt, padding: '6px 0' }}>
              Select or paste a farm address to stake, claim rewards, or unstake.
            </div>
          ) : !connected ? (
            <ConnectInline text="Connect a wallet to stake in this farm." onConnect={onConnect} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Stake */}
              <div>
                <FieldLabel>Amount to stake ({farm.stakingSymbol ?? 'tokens'})</FieldLabel>
                <TextField
                  value={stakeAmount}
                  onChange={(v) => setStakeAmount(v.replace(/[^0-9.]/g, ''))}
                  placeholder="0.00"
                  inputMode="decimal"
                />
                <PrimaryButton label={stakeLabel} onClick={onStakePrimary} disabled={stakeDisabled} />
              </div>

              {/* Claim */}
              <SecondaryButton
                label={
                  farm.pendingAction === 'claim'
                    ? 'Claiming…'
                    : farm.earned !== undefined && farm.earned > 0n
                      ? `Claim ${fmtAmount(farm.earned, farm.rewardDecimals)} ${farm.rewardSymbol ?? ''}`.trim()
                      : 'Nothing to claim'
                }
                onClick={() => void farm.claim()}
                disabled={!farm.canClaim}
              />

              {/* Unstake */}
              <div>
                <FieldLabel>Amount to unstake ({farm.stakingSymbol ?? 'tokens'})</FieldLabel>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <TextField
                      value={unstakeAmount}
                      onChange={(v) => setUnstakeAmount(v.replace(/[^0-9.]/g, ''))}
                      placeholder="0.00"
                      inputMode="decimal"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (farm.staked !== undefined && farm.stakingDecimals !== undefined) {
                        setUnstakeAmount(formatUnits(farm.staked, farm.stakingDecimals))
                      }
                    }}
                    disabled={farm.staked === undefined || farm.staked === 0n}
                    style={{
                      fontFamily: SANS,
                      fontSize: 12,
                      fontWeight: 600,
                      color: farm.staked && farm.staked > 0n ? terminalColors.ink2 : terminalColors.faint,
                      background: terminalColors.panel,
                      border: `1px solid ${terminalColors.line}`,
                      padding: '9px 12px',
                      borderRadius: 10,
                      cursor: farm.staked && farm.staked > 0n ? 'pointer' : 'default',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Max
                  </button>
                </div>
                {unstakeAmount !== '' && !farm.validUnstake ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, marginTop: 5 }}>
                    Enter an amount up to your staked balance.
                  </div>
                ) : null}
                <div style={{ marginTop: 10 }}>
                  <SecondaryButton
                    label={farm.pendingAction === 'withdraw' ? 'Unstaking…' : 'Unstake'}
                    onClick={() => void farm.withdraw()}
                    disabled={!farm.canWithdraw}
                  />
                </div>
              </div>

              {farm.actionError ? (
                <div style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.redDown, lineHeight: 1.5 }}>
                  {farm.actionError}
                </div>
              ) : (
                <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, lineHeight: 1.5 }}>
                  Staking approves the token once, then deposits. Claim and unstake need no approval. Balances refresh
                  from chain state after each transaction confirms.
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ the screen */

export function FarmsScreen(): JSX.Element {
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const [tab, setTab] = useState<FarmsTab>('create')

  const connected = Boolean(account.address)
  const owner = assume0xAddress(account.address)

  // Deployment status + wallet-independent reads reflect the DISPLAYED chain (mirrors VestingScreen).
  const { defaultChainId, chains } = useEnabledChains()
  const chainId = (account.chainId ?? defaultChainId ?? chains[0]) as typeof account.chainId
  const chainLabel = chainId ? getChainLabel(chainId) : '—'

  const factory = getFarmFactory(chainId)
  const deployed = Boolean(factory)

  // Farm registry (real read) — drives the "Total farms" tile + the Manage picker.
  const list = useFarmList({ chainId })
  const totalFarms = list.farms?.length

  // The Manage tab's selected farm lives here so the stat tiles reflect it too.
  const [selectedFarm, setSelectedFarm] = useState('')
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const farm = useFarm({ chainId, owner, farm: selectedFarm, stakeAmount, unstakeAmount })

  const totalFarmsValue = !deployed ? '—' : totalFarms !== undefined ? String(totalFarms) : undefined
  const yourStakeValue = !deployed || !farm.validFarm ? '—' : fmtAmount(farm.staked, farm.stakingDecimals)
  const totalStakedValue = !deployed || !farm.validFarm ? '—' : fmtAmount(farm.totalStaked, farm.stakingDecimals)
  const claimableValue = !deployed || !farm.validFarm ? '—' : fmtAmount(farm.earned, farm.rewardDecimals)

  const onConnect = (): void => accountDrawer.open()

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
          Farms
        </h1>
        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: terminalColors.ink3Alt }}>
          {totalFarms !== undefined ? `${totalFarms} total farms` : '— total farms'}
        </span>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink2, marginBottom: 18, maxWidth: 560, lineHeight: 1.5 }}>
        Launch a self-service staking farm — deposit a reward budget and stakers earn it over time — or stake into an
        existing farm and claim rewards. Any ERC-20 (including a v2 LP token) works as the staking token.
      </div>

      {/* Stat tiles — real contract reads (honest "—" when not deployed / no farm selected). */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard
          size="lg"
          label="Total farms"
          value={totalFarmsValue}
          loading={deployed && list.isLoading && totalFarms === undefined}
          error={list.error ? 'Failed to load' : undefined}
        />
        <StatCard size="lg" label="Your stake" value={yourStakeValue} />
        <StatCard size="lg" label="Total staked" value={totalStakedValue} />
        <StatCard
          size="lg"
          label="Claimable"
          value={claimableValue}
          valueColor={farm.earned !== undefined && farm.earned > 0n ? 'up' : 'ink'}
        />
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          background: terminalColors.panel2,
          padding: 4,
          borderRadius: 11,
          width: 'fit-content',
          marginBottom: 20,
        }}
      >
        {(['create', 'manage'] as const).map((id) => {
          const active = tab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                padding: '7px 18px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: 600,
                color: active ? terminalColors.ink : terminalColors.ink2,
                background: active ? terminalColors.bg : 'transparent',
                boxShadow: active ? '0 1px 2px rgba(11,15,20,.06)' : undefined,
              }}
            >
              {id === 'create' ? 'Create farm' : 'Stake / manage'}
            </button>
          )
        })}
      </div>

      {tab === 'create' ? (
        <CreateTab
          deployed={deployed}
          chainLabel={chainLabel}
          chainId={chainId}
          owner={owner}
          connected={connected}
          onConnect={onConnect}
        />
      ) : (
        <ManageTab
          deployed={deployed}
          connected={connected}
          chainLabel={chainLabel}
          chainId={chainId}
          owner={owner}
          onConnect={onConnect}
          selectedFarm={selectedFarm}
          setSelectedFarm={setSelectedFarm}
          farm={farm}
          stakeAmount={stakeAmount}
          setStakeAmount={setStakeAmount}
          unstakeAmount={unstakeAmount}
          setUnstakeAmount={setUnstakeAmount}
        />
      )}
    </div>
  )
}
