/**
 * HookSwap Terminal — Referrals.
 *
 * Reserve a referral code on-chain. NOTE: reward PAYOUTS are not live yet — swap
 * routing does not attach referral codes today (`useCaptureRef` captures `?ref=` but
 * nothing consumes it into the swap path yet), so no fees accrue through HookSwap and
 * `claimable` structurally reads 0 until that routing ships. The screen registers /
 * shares codes (real on-chain), but does NOT present a live-looking earnings flow.
 *
 * DATA POLICY (facts-only, no fabricated data — handoff hard rule):
 *   • The referral router is deployed on a subset of chains (see
 *     `~/terminal/referral/addresses.ts`). On a chain without a router the screen
 *     renders an honest "Referrals aren't live on {chain} yet" state — never mock
 *     data, never an error.
 *   • defaultFeeBps / codeOwner come from REAL on-chain reads (wagmi `useReadContract`).
 *     Until they resolve they read "—" / skeletons.
 *   • registerCode is a REAL write (`useWriteContract`) wired to the exact router ABI;
 *     disabled with an honest note when not deployed / disconnected.
 *   • The Earnings/Claim flow is intentionally NOT rendered: fees can't accrue until the
 *     swap path attaches referral codes, so a claimable-reader + Claim button would be a
 *     live-looking flow that always pays out 0. Shown as an honest "not live yet" note.
 *
 * The on-chain code is `keccak256(toBytes(<code>))` (bytes32); the shareable link
 * carries the PLAIN code as `?ref=<code>`, captured app-wide by `useCaptureRef`.
 *
 * Contract signatures: see `~/terminal/referral/abis.ts`.
 */
import { useMemo, useState } from 'react'
import { keccak256, toBytes, type Hex } from 'viem'
import { useReadContract, useWriteContract } from 'wagmi'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { zeroAddress, type Address } from '~/chains'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { useAccount } from '~/hooks/useAccount'
import { StatCard } from '~/terminal/components/StatCard'
import { referralRouterAbi } from '~/terminal/referral/abis'
import { getReferralRouter } from '~/terminal/referral/addresses'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'
import { assume0xAddress } from '~/utils/wagmi'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

/** Base URL for shareable referral links (per handoff spec). */
const REFERRAL_LINK_BASE = 'https://hookswap.org'

/* ------------------------------------------------------------------ helpers */

function shortAddr(a?: string): string {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—'
}

/** keccak256 of the UTF-8 code bytes → the on-chain bytes32, or undefined if empty. */
function codeHash(code: string): Hex | undefined {
  const trimmed = code.trim()
  return trimmed ? keccak256(toBytes(trimmed)) : undefined
}

/** bps (uint256) → percent label, e.g. 30n → "0.3%". */
function bpsToPercent(bps: bigint): string {
  const pct = Number(bps) / 100
  return `${pct % 1 === 0 ? pct.toFixed(0) : String(pct)}%`
}

type CodeStatus = 'none' | 'available' | 'yours' | 'taken'

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
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', color: terminalColors.ink3Alt }}>
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
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
}): JSX.Element {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '7px 0' }}>
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

function PrimaryButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        marginTop: 14,
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

/** Honest "referral router not deployed on this chain" note. */
function NotLiveNote({ chainLabel }: { chainLabel: string }): JSX.Element {
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
      Referrals aren&apos;t live on {chainLabel} yet. This panel activates automatically once the HookSwap referral router
      is deployed on this chain.
    </div>
  )
}

/**
 * Honest "connect your wallet" prompt (disconnected state). Referral codes are
 * registered to — and read against — the connected wallet, so nothing loads until a
 * wallet is connected. No code or stats are shown; the button opens the account drawer.
 */
function ConnectWalletNote({ onConnect }: { onConnect: () => void }): JSX.Element {
  return (
    <div
      style={{
        border: `1px dashed ${terminalColors.line}`,
        borderRadius: 11,
        background: terminalColors.panel,
        padding: '11px 13px',
      }}
    >
      <div style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink3Alt, lineHeight: 1.5, marginBottom: 11 }}>
        Connect your wallet to reserve a referral code. Codes are registered on-chain to your connected wallet, so nothing
        loads until a wallet is connected.
      </div>
      <button
        type="button"
        onClick={onConnect}
        style={{
          fontFamily: SANS,
          fontSize: 12.5,
          fontWeight: 600,
          color: terminalColors.btnInk,
          background: terminalColors.brandGreen,
          border: 'none',
          padding: '9px 16px',
          borderRadius: 10,
          cursor: 'pointer',
        }}
      >
        Connect wallet
      </button>
    </div>
  )
}

/**
 * Honest "reward payouts not live yet" note for the Earnings panel. Describes how
 * referral rewards WILL work once fee routing ships — no claim UI is presented here
 * because fees can't accrue yet (see the earnings/claim comment in the screen body).
 */
function RewardsNotLiveNote(): JSX.Element {
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 12.5,
        color: terminalColors.ink3Alt,
        lineHeight: 1.5,
        border: `1px solid ${terminalColors.greenBorder}`,
        borderRadius: 11,
        background: terminalColors.greenBg,
        padding: '11px 13px',
      }}
    >
      Reward payouts aren&apos;t live yet. Once fee routing ships, referral rewards will accrue on single-hop v3 swaps
      when users trade with your <code>?ref=</code> link — a share of the input token set aside per swap and withdrawable
      to your claim wallet. Until then no fees accrue, so there&apos;s nothing to claim. Register your code now so it&apos;s
      ready the moment payouts go live.
    </div>
  )
}

function CopyRow({ text }: { text: string }): JSX.Element {
  const [copied, setCopied] = useState(false)
  const onCopy = (): void => {
    try {
      void navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      // Clipboard can be unavailable (insecure context) — no-op, link is visible.
    }
  }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 11,
        background: terminalColors.panel,
        padding: '9px 10px 9px 12px',
      }}
    >
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: MONO,
          fontSize: 12.5,
          color: terminalColors.ink,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </span>
      <button
        type="button"
        onClick={onCopy}
        style={{
          fontFamily: SANS,
          fontSize: 12,
          fontWeight: 600,
          color: copied ? terminalColors.greenDeep : terminalColors.ink2,
          background: copied ? terminalColors.greenBg : terminalColors.bg,
          border: `1px solid ${copied ? terminalColors.greenBorder : terminalColors.line}`,
          padding: '6px 12px',
          borderRadius: 9,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

function CodeStatusPill({ status }: { status: CodeStatus }): JSX.Element | null {
  if (status === 'none') {
    return null
  }
  const map: Record<Exclude<CodeStatus, 'none'>, { label: string; good: boolean }> = {
    available: { label: 'Available', good: true },
    yours: { label: 'Registered to you', good: true },
    taken: { label: 'Taken', good: false },
  }
  const { label, good } = map[status]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: SANS,
        fontSize: 11.5,
        fontWeight: 600,
        color: good ? terminalColors.greenDeep : terminalColors.ink2,
        background: good ? terminalColors.greenBg : terminalColors.panel2,
        border: `1px solid ${good ? terminalColors.greenBorder : terminalColors.line}`,
        padding: '3px 9px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: good ? terminalColors.greenDeep : terminalColors.ink3 }} />
      {label}
    </span>
  )
}

/* ------------------------------------------------------------------ the screen */

export function ReferralsScreen(): JSX.Element {
  const account = useAccount()
  const accountDrawer = useAccountDrawer()

  const connected = Boolean(account.address)
  const owner = assume0xAddress(account.address)
  const chainId = account.chainId
  const chainLabel = chainId ? getChainLabel(chainId) : '—'
  const onConnect = (): void => accountDrawer.open()

  const router = getReferralRouter(chainId)
  const deployed = Boolean(router)

  /* ---------------------------------------------------------------- fee read */
  const feeRead = useReadContract({
    address: router,
    chainId,
    abi: referralRouterAbi,
    functionName: 'defaultFeeBps',
    query: { enabled: deployed },
  })
  const feeBps = feeRead.data as bigint | undefined
  const feeValue = !deployed ? '—' : feeBps !== undefined ? bpsToPercent(feeBps) : undefined

  /* ---------------------------------------------------------------- code + ownership */
  const [code, setCode] = useState('')
  const hash = codeHash(code)
  const link = `${REFERRAL_LINK_BASE}/?ref=${encodeURIComponent(code.trim())}`

  const ownerRead = useReadContract({
    address: router,
    chainId,
    abi: referralRouterAbi,
    functionName: 'codeOwner',
    args: hash ? [hash] : undefined,
    query: { enabled: deployed && Boolean(hash) },
  })
  const codeOwnerAddr = ownerRead.data as Address | undefined

  const status: CodeStatus = useMemo(() => {
    if (!hash || !deployed || codeOwnerAddr === undefined) {
      return 'none'
    }
    if (codeOwnerAddr === zeroAddress) {
      return 'available'
    }
    if (owner && codeOwnerAddr.toLowerCase() === owner.toLowerCase()) {
      return 'yours'
    }
    return 'taken'
  }, [hash, deployed, codeOwnerAddr, owner])

  const { writeContractAsync: writeRegister, isPending: registerPending } = useWriteContract()

  const canRegister = deployed && connected && Boolean(hash) && status === 'available' && !registerPending
  const onRegister = async (): Promise<void> => {
    if (!connected) {
      onConnect()
      return
    }
    if (!router || !hash || !owner) {
      return
    }
    await writeRegister({
      address: router,
      chainId,
      abi: referralRouterAbi,
      functionName: 'registerCode',
      // claim wallet = the connected wallet.
      args: [hash, owner],
    })
  }

  const registerLabel = !connected
    ? 'Connect wallet to register'
    : !deployed
      ? 'Not available on this network'
      : registerPending
        ? 'Confirm in wallet…'
        : status === 'yours'
          ? 'Already registered to you'
          : status === 'taken'
            ? 'Code taken'
            : 'Register code'

  /* ---------------------------------------------------------------- earnings / claim
   * INTENTIONALLY NOT WIRED. Reward payouts are not live: the swap path does not attach
   * the captured `?ref=` code (`getStoredReferrer` has no consumer), so no fees are ever
   * routed to a code and on-chain `claimable` is structurally 0. Presenting a token-input
   * + claimable-reader + Claim button here would be a live-looking flow that can never pay
   * out — so the Earnings panel shows an honest "not live yet" state instead (no fabricated
   * numbers, no pointless zero-value claim tx). Re-wire this when fee routing ships. */

  /* ---------------------------------------------------------------- stat tiles */
  const statusLoading = deployed && Boolean(hash) && ownerRead.isLoading && codeOwnerAddr === undefined
  const statusValue: string | undefined =
    !deployed || !hash
      ? '—'
      : statusLoading
        ? undefined // StatCard renders its skeleton while value is undefined
        : status === 'yours'
          ? 'Registered'
          : status === 'available'
            ? 'Available'
            : status === 'taken'
              ? 'Taken'
              : '—'

  const networkValue = !connected ? '—' : deployed ? chainLabel : 'Not live'

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
          Referrals
        </h1>
        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: terminalColors.ink3Alt }}>
          {feeValue && feeValue !== '—' ? `${feeValue} configured fee · payouts not live` : ''}
        </span>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink2, marginBottom: 18, maxWidth: 600, lineHeight: 1.5 }}>
        Reserve a referral code on-chain and share your link — the code is captured automatically when someone lands on
        HookSwap with it. Note: reward payouts aren&apos;t live yet, so no fees accrue and there&apos;s nothing to claim
        today. Your code is reserved for when fee routing ships.
      </div>

      {/* Stat tiles — real contract reads (honest "—" when not deployed / no code). */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatCard
          size="lg"
          label="Referral fee"
          value={feeValue}
          loading={deployed && feeRead.isLoading && feeBps === undefined}
          error={feeRead.error ? 'Failed to load' : undefined}
          valueColor="up"
        />
        <StatCard size="lg" label="Your code status" value={statusValue} loading={statusLoading} />
        <StatCard size="lg" label="Network" value={networkValue} valueColor={deployed ? 'up' : 'ink'} />
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Your referral link + register */}
        <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel>
            <StepLabel index="01" label="Your referral code" note={!connected ? 'connect wallet' : deployed ? undefined : 'not live'} />
            {!connected ? (
              <ConnectWalletNote onConnect={onConnect} />
            ) : !deployed ? (
              <NotLiveNote chainLabel={chainLabel} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                    <FieldLabel>Code</FieldLabel>
                    <CodeStatusPill status={status} />
                  </div>
                  <TextField value={code} onChange={setCode} placeholder="e.g. reggie" mono={false} />
                </div>

                {hash ? (
                  <>
                    <div>
                      <FieldLabel>On-chain code (keccak256)</FieldLabel>
                      <div
                        style={{
                          fontFamily: MONO,
                          fontSize: 11.5,
                          color: terminalColors.ink2,
                          background: terminalColors.panel,
                          border: `1px solid ${terminalColors.line}`,
                          borderRadius: 10,
                          padding: '9px 11px',
                          wordBreak: 'break-all',
                          lineHeight: 1.45,
                        }}
                      >
                        {hash}
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Shareable link</FieldLabel>
                      <CopyRow text={link} />
                    </div>
                  </>
                ) : (
                  <div style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.faint, lineHeight: 1.5 }}>
                    Enter a code to preview its on-chain hash and shareable link.
                  </div>
                )}
              </div>
            )}
          </Panel>

          <Panel>
            <SummaryRow label="Referral fee" value={feeValue ?? '…'} valueColor={feeValue && feeValue !== '—' ? terminalColors.ink : terminalColors.faint} />
            <SummaryRow label="Claim wallet" value={connected ? shortAddr(account.address) : 'Not connected'} />
            <SummaryRow label="Network" value={connected ? chainLabel : '—'} />
            <PrimaryButton label={registerLabel} onClick={() => void onRegister()} disabled={connected && !canRegister} />
            {deployed ? (
              <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, marginTop: 10, lineHeight: 1.5 }}>
                Registering claims the code on-chain and sets your connected wallet as the claim wallet. Reward payouts
                aren&apos;t live yet — once fee routing ships, fees accrued to the code will be withdrawable to this wallet.
              </div>
            ) : null}
          </Panel>
        </div>

        {/* Earnings / claim */}
        <div style={{ flex: '1 1 340px', minWidth: 0 }}>
          <Panel>
            <StepLabel index="02" label="Earnings" />
            {!connected ? (
              <ConnectWalletNote onConnect={onConnect} />
            ) : !deployed ? (
              <NotLiveNote chainLabel={chainLabel} />
            ) : (
              <RewardsNotLiveNote />
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
