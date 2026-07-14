/**
 * HookSwap Terminal — Vesting (create schedules + beneficiaries claim).
 *
 * Robinhood-only launch scope. Two tabs:
 *   • "Create"          — HookSwapVestingManager `createVesting(token, beneficiary, amount,
 *                         startTime, cliffDuration, duration)`: deploys a funded, NON-revocable
 *                         `HookSwapVesting` child that releases on a cliff + linear curve.
 *   • "My schedules"    — every schedule the connected wallet is the beneficiary OR the creator
 *                         of, with a real Release (claim) action for the beneficiary.
 *
 * DATA POLICY (facts-only, no fabricated data — handoff hard rule):
 *   • The manager address is config-driven (`~/terminal/vesting/addresses.ts`). Until it is
 *     deployed on a chain the screen renders an honest "Vesting isn't deployed on {chain} yet"
 *     state — never an error, never mock data.
 *   • The funding token's symbol/decimals, `vestingFee()`, `vestingCount()`, the user's
 *     schedules and every amount (total / vested / claimable / locked) are REAL on-chain reads.
 *     They read "—" until they resolve.
 *   • `createVesting` PULLS the tokens via `transferFrom`, so the button is GATED behind a live
 *     ERC-20 allowance: it stays "Approve token" until the approval is CONFIRMED on-chain, so a
 *     user can never sign a create tx that would revert for a missing allowance.
 *   • `release()` is beneficiary-ONLY on the child contract — the Release button is enabled only
 *     for the beneficiary, and only when the live `releasable()` is non-zero.
 *
 * Contract signatures: see `~/terminal/vesting/abis.ts`
 * (`contracts/vesting/src/HookSwapVestingManager.sol` + `HookSwapVesting.sol`).
 */
import { useState } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { useReadContract } from 'wagmi'
import { formatUnits, type Address } from '~/chains'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { useAccount } from '~/hooks/useAccount'
import { StatCard } from '~/terminal/components/StatCard'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'
import { vestingManagerAbi } from '~/terminal/vesting/abis'
import { getVestingAddress } from '~/terminal/vesting/addresses'
import { useCreateVesting } from '~/terminal/vesting/useCreateVesting'
import { useMySchedules, type VestingScheduleRow } from '~/terminal/vesting/useMySchedules'
import { assume0xAddress } from '~/utils/wagmi'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

type VestingTab = 'create' | 'claim'

/* ------------------------------------------------------------------ helpers */

function shortAddr(a?: string): string {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—'
}

/** datetime-local value → unix seconds, or undefined if empty/invalid. */
function toUnix(value: string): number | undefined {
  if (!value) {
    return undefined
  }
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : undefined
}

/** unix seconds → compact local date label. */
function fmtDate(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Duration units, in exact seconds (months/years are stated as fixed windows — no calendar drift). */
const DURATION_UNITS = {
  days: 86_400,
  weeks: 604_800,
  months: 2_592_000, // 30 days
  years: 31_536_000, // 365 days
} as const
type DurationUnit = keyof typeof DURATION_UNITS

const UNIT_LABEL: Record<DurationUnit, string> = {
  days: 'Days',
  weeks: 'Weeks',
  months: 'Months (30d)',
  years: 'Years (365d)',
}

/** `{ value, unit }` → whole seconds, or undefined when the value is empty/invalid. */
function toSeconds(value: string, unit: DurationUnit): number | undefined {
  if (value === '') {
    return undefined
  }
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) {
    return undefined
  }
  return Math.floor(n * DURATION_UNITS[unit])
}

/** Seconds → a compact human label (e.g. "2y 6mo", "14d"). */
function fmtDuration(seconds: number): string {
  if (seconds <= 0) {
    return '0'
  }
  const years = Math.floor(seconds / DURATION_UNITS.years)
  const afterYears = seconds - years * DURATION_UNITS.years
  const months = Math.floor(afterYears / DURATION_UNITS.months)
  const afterMonths = afterYears - months * DURATION_UNITS.months
  const days = Math.floor(afterMonths / DURATION_UNITS.days)
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
    return hours > 0 ? `${hours}h` : `${seconds}s`
  }
  return parts.join(' ')
}

/** Raw token units → a readable amount using the token's real decimals ("—" until known). */
function fmtAmount(raw: bigint, decimals?: number): string {
  if (decimals === undefined) {
    return '—'
  }
  const n = Number(formatUnits(raw, decimals))
  if (!Number.isFinite(n)) {
    return '—'
  }
  return n.toLocaleString('en-US', { maximumFractionDigits: 6 })
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
  type = 'text',
  inputMode,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
  type?: string
  inputMode?: 'text' | 'decimal' | 'numeric'
}): JSX.Element {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
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

/** Styled native <select> matching the terminal TextField look. */
function SelectField({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}): JSX.Element {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 11,
        background: terminalColors.bg,
        padding: '10px 12px',
        fontFamily: SANS,
        fontSize: 13.5,
        fontWeight: 500,
        color: terminalColors.ink,
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </select>
  )
}

/** Amount + unit pair → a duration in seconds. */
function DurationField({
  label,
  value,
  unit,
  onValue,
  onUnit,
  hint,
  error,
}: {
  label: string
  value: string
  unit: DurationUnit
  onValue: (v: string) => void
  onUnit: (u: DurationUnit) => void
  hint?: string
  error?: string
}): JSX.Element {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: '1 1 100px', minWidth: 0 }}>
          <TextField
            value={value}
            onChange={(v) => onValue(v.replace(/[^0-9.]/g, ''))}
            placeholder="0"
            inputMode="decimal"
          />
        </div>
        <div style={{ flex: '1 1 130px', minWidth: 0 }}>
          <SelectField value={unit} onChange={(v) => onUnit(v as DurationUnit)}>
            {(Object.keys(DURATION_UNITS) as DurationUnit[]).map((u) => (
              <option key={u} value={u}>
                {UNIT_LABEL[u]}
              </option>
            ))}
          </SelectField>
        </div>
      </div>
      {error ? (
        <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, marginTop: 5 }}>{error}</div>
      ) : hint ? (
        <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt, marginTop: 5 }}>{hint}</div>
      ) : null}
    </div>
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

function PrimaryButton({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}): JSX.Element {
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
      Vesting isn&apos;t live on {chainLabel} yet — this panel activates automatically once the HookSwap vesting manager
      is deployed.
    </div>
  )
}

function rowActionStyle(enabled: boolean): React.CSSProperties {
  return {
    fontFamily: SANS,
    fontSize: 12,
    fontWeight: 600,
    color: enabled ? terminalColors.greenDeep : terminalColors.faint,
    background: enabled ? terminalColors.greenBg : terminalColors.panel,
    border: `1px solid ${enabled ? terminalColors.greenBorder : terminalColors.line}`,
    padding: '6px 12px',
    borderRadius: 9,
    cursor: enabled ? 'pointer' : 'default',
    whiteSpace: 'nowrap',
  }
}

function ConnectInline({ onConnect }: { onConnect: () => void }): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, padding: '10px 0' }}>
      <div style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink2 }}>
        Connect a wallet to see your vesting schedules.
      </div>
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

function EmptyInline({ text }: { text: string }): JSX.Element {
  return <div style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink3Alt, padding: '6px 0' }}>{text}</div>
}

function ErrorInline({ onRetry }: { onRetry: () => void }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.redDown }}>
        Failed to load vesting schedules.
      </span>
      <button
        type="button"
        onClick={onRetry}
        style={{
          fontFamily: SANS,
          fontSize: 12,
          fontWeight: 600,
          color: terminalColors.ink2,
          background: terminalColors.panel,
          border: `1px solid ${terminalColors.line}`,
          padding: '5px 12px',
          borderRadius: 9,
          cursor: 'pointer',
        }}
      >
        Retry
      </button>
    </div>
  )
}

function SkeletonRows(): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ height: 12, width: '45%', borderRadius: 4, background: terminalColors.line2 }} />
              <div style={{ height: 10, width: '65%', borderRadius: 4, background: terminalColors.line3, marginTop: 6 }} />
            </div>
            <div style={{ height: 26, width: 78, borderRadius: 9, background: terminalColors.line2 }} />
          </div>
          <div style={{ height: 8, borderRadius: 999, background: terminalColors.line3, marginTop: 12 }} />
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ create tab */

function CreateTab({
  manager,
  chainLabel,
  chainId,
  owner,
  connected,
  onConnect,
  nativeSymbol,
  nativeDecimals,
}: {
  manager: Address | undefined
  chainLabel: string
  chainId?: number
  owner: Address | undefined
  connected: boolean
  onConnect: () => void
  nativeSymbol?: string
  nativeDecimals?: number
}): JSX.Element {
  const deployed = Boolean(manager)

  const [token, setToken] = useState('')
  const [beneficiary, setBeneficiary] = useState('')
  const [amount, setAmount] = useState('')
  const [start, setStart] = useState('')
  const [cliffValue, setCliffValue] = useState('0')
  const [cliffUnit, setCliffUnit] = useState<DurationUnit>('months')
  const [durationValue, setDurationValue] = useState('')
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('years')

  const startUnix = toUnix(start)
  const cliffSeconds = toSeconds(cliffValue, cliffUnit)
  const durationSeconds = toSeconds(durationValue, durationUnit)

  const vesting = useCreateVesting({
    chainId,
    owner,
    token,
    beneficiary,
    amount,
    startUnix,
    cliffSeconds,
    durationSeconds,
  })

  const feeLabel =
    !deployed
      ? '—'
      : vesting.vestingFee !== undefined
        ? vesting.vestingFee === 0n
          ? 'Free'
          : `${formatUnits(vesting.vestingFee, nativeDecimals ?? 18)} ${nativeSymbol ?? ''}`.trim()
        : '…'

  const symbolLabel = vesting.tokenSymbol ?? (vesting.validToken ? '…' : '—')

  const onPrimary = (): void => {
    if (!connected) {
      onConnect()
      return
    }
    if (vesting.isDone) {
      // Create another schedule.
      vesting.reset()
      setAmount('')
      setBeneficiary('')
      return
    }
    void (vesting.needsApproval ? vesting.approve() : vesting.create())
  }

  const primaryLabel = ((): string => {
    if (!deployed) {
      return 'Not available on this network'
    }
    if (!connected) {
      return 'Connect wallet to create a schedule'
    }
    if (vesting.isDone) {
      return 'Create another schedule'
    }
    if (!vesting.inputsValid) {
      return 'Enter token, beneficiary, amount & schedule'
    }
    if (!vesting.allowanceKnown) {
      return 'Checking approval…'
    }
    if (vesting.needsApproval) {
      if (vesting.approving) {
        return 'Approving…'
      }
      return vesting.isWritePending ? 'Confirm in wallet…' : 'Approve token'
    }
    if (vesting.isWritePending) {
      return 'Confirm in wallet…'
    }
    if (vesting.isConfirming) {
      return 'Creating schedule…'
    }
    return 'Create schedule'
  })()

  const primaryDisabled = ((): boolean => {
    if (!deployed) {
      return true
    }
    if (!connected) {
      return false
    }
    if (vesting.isDone) {
      return false
    }
    return vesting.needsApproval ? !vesting.canApprove : !vesting.canCreate
  })()

  // Honest inline validation messages (mirror the contract's requires).
  const cliffError =
    cliffSeconds !== undefined && durationSeconds !== undefined && cliffSeconds > durationSeconds
      ? 'Cliff cannot exceed the total duration.'
      : undefined
  const durationError =
    durationValue !== '' && (durationSeconds === undefined || durationSeconds <= 0)
      ? 'Duration must be greater than zero.'
      : undefined

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Left: schedule details */}
      <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Panel>
          <StepLabel index="01" label="Schedule details" note={deployed ? undefined : 'not deployed'} />
          {!deployed ? (
            <NotDeployedNote chainLabel={chainLabel} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <FieldLabel>Token address</FieldLabel>
                <TextField value={token} onChange={setToken} placeholder="0x…" />
                {token !== '' && !vesting.validToken ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, marginTop: 5 }}>
                    Enter a valid ERC-20 contract address.
                  </div>
                ) : vesting.tokenSymbol ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt, marginTop: 5 }}>
                    {vesting.tokenSymbol}
                    {vesting.tokenDecimals !== undefined ? ` · ${vesting.tokenDecimals} decimals` : ''}
                  </div>
                ) : null}
              </div>

              <div>
                <FieldLabel>Beneficiary</FieldLabel>
                <TextField value={beneficiary} onChange={setBeneficiary} placeholder="0x…" />
                {beneficiary !== '' && !vesting.validBeneficiary ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, marginTop: 5 }}>
                    Enter a valid wallet address.
                  </div>
                ) : null}
              </div>

              <div>
                <FieldLabel>Amount to vest (whole tokens)</FieldLabel>
                <TextField
                  value={amount}
                  onChange={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </div>

              <div>
                <FieldLabel>Start date &amp; time</FieldLabel>
                <TextField value={start} onChange={setStart} type="datetime-local" mono={false} />
              </div>

              <DurationField
                label="Cliff"
                value={cliffValue}
                unit={cliffUnit}
                onValue={setCliffValue}
                onUnit={setCliffUnit}
                hint="Nothing is claimable until the cliff passes. Use 0 for no cliff."
                error={cliffError}
              />

              <DurationField
                label="Total duration"
                value={durationValue}
                unit={durationUnit}
                onValue={setDurationValue}
                onUnit={setDurationUnit}
                hint="Tokens vest linearly from the start until the full duration has elapsed."
                error={durationError}
              />
            </div>
          )}
        </Panel>

        {deployed ? (
          <Notice tone="muted">
            Vesting is non-revocable. The tokens are moved into a dedicated schedule contract on creation and can only
            be claimed by the beneficiary, on the curve — not even you can pull them back.
          </Notice>
        ) : null}
      </div>

      {/* Right: review + create */}
      <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Panel>
          <SummaryRow label="Token" value={symbolLabel} />
          <SummaryRow label="Beneficiary" value={vesting.validBeneficiary ? shortAddr(beneficiary) : '—'} />
          <SummaryRow
            label="Amount"
            value={vesting.validAmount && amount !== '' ? `${Number(amount).toLocaleString('en-US')}` : '—'}
          />
          <SummaryRow label="Starts" value={startUnix !== undefined ? fmtDate(startUnix) : '—'} />
          <SummaryRow
            label="Cliff"
            value={cliffSeconds !== undefined ? (cliffSeconds === 0 ? 'None' : fmtDuration(cliffSeconds)) : '—'}
          />
          <SummaryRow
            label="Duration"
            value={durationSeconds !== undefined && durationSeconds > 0 ? fmtDuration(durationSeconds) : '—'}
          />
          <SummaryRow label="Create fee" value={feeLabel} />
          <SummaryRow label="Funded by" value={connected && owner ? shortAddr(owner) : '—'} />
          <SummaryRow label="Network" value={deployed ? chainLabel : 'Not available'} />

          <PrimaryButton label={primaryLabel} onClick={onPrimary} disabled={primaryDisabled} />

          {vesting.isDone ? (
            <div style={{ marginTop: 10 }}>
              <Notice tone="green">
                Vesting schedule created. The tokens are now held by the schedule contract and unlock on the curve —
                the beneficiary can claim them from the &ldquo;My schedules&rdquo; tab.
              </Notice>
            </div>
          ) : vesting.error ? (
            <div style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.redDown, marginTop: 10, lineHeight: 1.5 }}>
              {vesting.error}
            </div>
          ) : deployed ? (
            <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, marginTop: 10, lineHeight: 1.5 }}>
              You approve the token once, then create. Creating transfers the full amount into a dedicated schedule
              contract; the beneficiary claims it as it vests.
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ claim tab */

/** Vested / claimable / locked split for one schedule. */
function ProgressBar({ row }: { row: VestingScheduleRow }): JSX.Element {
  const total = row.totalAmount
  const pct = (part: bigint): number => {
    if (total === 0n) {
      return 0
    }
    // Ratio in basis points to stay exact in bigint, then down to a float percentage.
    return Number((part * 10_000n) / total) / 100
  }
  const releasedPct = pct(row.released)
  const claimablePct = pct(row.releasable)

  return (
    <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', background: terminalColors.panel2 }}>
      {row.released > 0n ? (
        <div title="Claimed" style={{ width: `${releasedPct}%`, background: terminalColors.ink3 }} />
      ) : null}
      {row.releasable > 0n ? (
        <div title="Claimable" style={{ width: `${claimablePct}%`, background: terminalColors.greenUp }} />
      ) : null}
    </div>
  )
}

function ScheduleRowItem({
  row,
  isFirst,
  isReleasing,
  releasingChild,
  onRelease,
}: {
  row: VestingScheduleRow
  isFirst: boolean
  isReleasing: boolean
  releasingChild?: Address
  onRelease: (child: Address) => void
}): JSX.Element {
  const d = row.tokenDecimals
  const thisReleasing = isReleasing && releasingChild?.toLowerCase() === row.contractAddress.toLowerCase()
  // `release()` is beneficiary-ONLY on the child, and pays out `releasable()` — so the action
  // is live only for the beneficiary, and only when something is actually claimable.
  const canRelease = row.isBeneficiary && row.releasable > 0n && !isReleasing
  const cliffEnd = row.start + row.cliff
  const now = Math.floor(Date.now() / 1000)

  const releaseLabel = ((): string => {
    if (thisReleasing) {
      return 'Claiming…'
    }
    if (!row.isBeneficiary) {
      return 'Beneficiary only'
    }
    if (row.releasable === 0n) {
      return now < cliffEnd ? 'In cliff' : 'Nothing to claim'
    }
    return 'Release'
  })()

  return (
    <div style={{ padding: '14px 0', borderTop: isFirst ? undefined : `1px solid ${terminalColors.line3}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: terminalColors.ink }}>
              {row.tokenSymbol ?? shortAddr(row.token)}
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                fontWeight: 600,
                color: row.isBeneficiary ? terminalColors.greenDeep : terminalColors.accentIndigo,
                background: row.isBeneficiary ? terminalColors.greenBg : terminalColors.panel2,
                padding: '1px 6px',
                borderRadius: 999,
              }}
            >
              {row.isBeneficiary ? 'RECEIVING' : 'GRANTED'}
            </span>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 12, color: terminalColors.ink3Alt, marginTop: 3 }}>
            {row.isBeneficiary ? `From ${shortAddr(row.creator)}` : `To ${shortAddr(row.beneficiary)}`} · starts{' '}
            {fmtDate(row.start)} · {fmtDuration(row.duration)}
            {row.cliff > 0 ? ` · ${fmtDuration(row.cliff)} cliff` : ''}
          </div>
        </div>
        <button
          type="button"
          disabled={!canRelease}
          onClick={() => onRelease(row.contractAddress)}
          style={rowActionStyle(canRelease)}
        >
          {releaseLabel}
        </button>
      </div>

      <ProgressBar row={row} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', marginTop: 10 }}>
        <ScheduleStat label="Total" value={fmtAmount(row.totalAmount, d)} />
        <ScheduleStat label="Vested" value={fmtAmount(row.vested, d)} />
        <ScheduleStat label="Claimable" value={fmtAmount(row.releasable, d)} accent={row.releasable > 0n} />
        <ScheduleStat label="Locked" value={fmtAmount(row.locked, d)} />
      </div>
    </div>
  )
}

function ScheduleStat({ label, value, accent }: { label: string; value: string; accent?: boolean }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.ink3Alt }}>{label}</span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 12.5,
          fontWeight: 500,
          color: accent ? terminalColors.greenDeep : terminalColors.ink,
        }}
      >
        {value}
      </span>
    </div>
  )
}

function ClaimTab({
  deployed,
  connected,
  chainLabel,
  chainId,
  owner,
  onConnect,
}: {
  deployed: boolean
  connected: boolean
  chainLabel: string
  chainId?: number
  owner: Address | undefined
  onConnect: () => void
}): JSX.Element {
  const schedules = useMySchedules({ chainId, owner })

  const body = ((): JSX.Element => {
    if (!deployed) {
      return <NotDeployedNote chainLabel={chainLabel} />
    }
    if (!connected) {
      return <ConnectInline onConnect={onConnect} />
    }
    if (schedules.error) {
      return <ErrorInline onRetry={schedules.refetch} />
    }
    if (schedules.rows === undefined) {
      return <SkeletonRows />
    }
    if (schedules.rows.length === 0) {
      return <EmptyInline text="You have no vesting schedules yet." />
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {schedules.rows.map((row, i) => (
          <ScheduleRowItem
            key={String(row.id)}
            row={row}
            isFirst={i === 0}
            isReleasing={schedules.isReleasing}
            releasingChild={schedules.releasingChild}
            onRelease={(child) => void schedules.release(child)}
          />
        ))}
      </div>
    )
  })()

  return (
    <Panel>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: terminalColors.ink }}>
          My vesting schedules
        </span>
        <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', color: terminalColors.ink3Alt }}>
          RECEIVING + GRANTED
        </span>
      </div>

      {body}

      {schedules.releaseError ? (
        <div style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.redDown, marginTop: 12, lineHeight: 1.5 }}>
          {schedules.releaseError}
        </div>
      ) : null}
    </Panel>
  )
}

/* ------------------------------------------------------------------ the screen */

export function VestingScreen(): JSX.Element {
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const [tab, setTab] = useState<VestingTab>('create')

  const connected = Boolean(account.address)
  const owner = assume0xAddress(account.address)

  // Deployment status + the wallet-independent reads reflect the DISPLAYED chain, so a
  // disconnected user still sees vesting as live on the current network (mirrors LockerScreen).
  const { defaultChainId, chains } = useEnabledChains()
  // Fallbacks are always EVM chains at runtime; cast to account.chainId's EVM-narrow union
  // (excludes Solana) so wagmi's useReadContract chainId type is satisfied.
  const chainId = (account.chainId ?? defaultChainId ?? chains[0]) as typeof account.chainId
  const chainLabel = chainId ? getChainLabel(chainId) : '—'
  const native = chainId ? getChainInfo(chainId).nativeCurrency : undefined

  const manager = getVestingAddress(chainId)
  const deployed = Boolean(manager)

  // Registry-wide schedule count (real read) — "—" until deployed.
  const countRead = useReadContract({
    address: manager,
    chainId,
    abi: vestingManagerAbi,
    functionName: 'vestingCount',
    query: { enabled: Boolean(manager && chainId) },
  })
  const totalCount = countRead.data as bigint | undefined

  // Native create fee (real read).
  const feeRead = useReadContract({
    address: manager,
    chainId,
    abi: vestingManagerAbi,
    functionName: 'vestingFee',
    query: { enabled: Boolean(manager && chainId) },
  })
  const vestingFee = feeRead.data as bigint | undefined

  // The user's real schedules — drive the "Your schedules" / "Claimable now" tiles.
  // wagmi dedupes these identical reads with the Claim tab's copies (same query keys).
  const mine = useMySchedules({ chainId, owner })
  const minesLoading = connected && deployed && !mine.error && mine.rows === undefined

  const yourCount = mine.rows?.length ?? 0
  const claimableCount = (mine.rows ?? []).filter((r) => r.isBeneficiary && r.releasable > 0n).length

  const totalSchedulesValue = !deployed ? '—' : totalCount !== undefined ? String(totalCount) : undefined
  const yourSchedulesValue = !connected || !deployed ? '—' : minesLoading ? undefined : String(yourCount)
  const claimableValue = !connected || !deployed ? '—' : minesLoading ? undefined : String(claimableCount)
  const feeValue = !deployed
    ? '—'
    : vestingFee !== undefined
      ? vestingFee === 0n
        ? 'Free'
        : `${formatUnits(vestingFee, native?.decimals ?? 18)} ${native?.symbol ?? ''}`.trim()
      : undefined

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
          Vesting
        </h1>
        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: terminalColors.ink3Alt }}>
          {totalCount !== undefined ? `${String(totalCount)} total schedules` : '— total schedules'}
        </span>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink2, marginBottom: 18, maxWidth: 560, lineHeight: 1.5 }}>
        Vest tokens to a team member, investor, or your own treasury on a cliff + linear schedule. Tokens are held by a
        dedicated contract and unlock over time — the beneficiary claims them as they vest.
      </div>

      {/* Stat tiles — real contract reads (honest "—" when not deployed / disconnected). */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard
          size="lg"
          label="Total schedules"
          value={totalSchedulesValue}
          loading={deployed && countRead.isLoading && totalCount === undefined}
          error={countRead.error ? 'Failed to load' : undefined}
        />
        <StatCard size="lg" label="Your schedules" value={yourSchedulesValue} loading={Boolean(minesLoading)} />
        <StatCard
          size="lg"
          label="Claimable now"
          value={claimableValue}
          loading={Boolean(minesLoading)}
          valueColor={claimableCount > 0 ? 'up' : 'ink'}
        />
        <StatCard
          size="lg"
          label="Create fee"
          value={feeValue}
          loading={deployed && feeRead.isLoading && vestingFee === undefined}
          error={feeRead.error ? 'Failed to load' : undefined}
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
        {(['create', 'claim'] as const).map((id) => {
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
              {id === 'create' ? 'Create' : 'My schedules'}
            </button>
          )
        })}
      </div>

      {tab === 'create' ? (
        <CreateTab
          manager={manager}
          chainLabel={chainLabel}
          chainId={chainId}
          owner={owner}
          connected={connected}
          onConnect={onConnect}
          nativeSymbol={native?.symbol}
          nativeDecimals={native?.decimals}
        />
      ) : (
        <ClaimTab
          deployed={deployed}
          connected={connected}
          chainLabel={chainLabel}
          chainId={chainId}
          owner={owner}
          onConnect={onConnect}
        />
      )}
    </div>
  )
}
