/**
 * HookSwap Terminal — Referrals.
 *
 * Earn a share of the swap fee on every trade routed with your referral code.
 *
 * DATA POLICY (facts-only, no fabricated data — handoff hard rule):
 *   • The referral router is deployed on a subset of chains (see
 *     `~/terminal/referral/addresses.ts`). On a chain without a router the screen
 *     renders an honest "Referrals aren't live on {chain} yet" state — never mock
 *     data, never an error.
 *   • defaultFeeBps / codeOwner / claimable all come from REAL on-chain reads
 *     (wagmi `useReadContract`). Until they resolve they read "—" / skeletons.
 *   • registerCode / claim are REAL writes (`useWriteContract`) wired to the exact
 *     router ABI; disabled with an honest note when not deployed / disconnected.
 *
 * The on-chain code is `keccak256(toBytes(<code>))` (bytes32); the shareable link
 * carries the PLAIN code as `?ref=<code>`, captured app-wide by `useCaptureRef`.
 *
 * Contract signatures: see `~/terminal/referral/abis.ts`.
 */
import { useMemo, useState } from 'react'
import { keccak256, toBytes, type Hex } from 'viem'
import { useReadContract, useWriteContract } from 'wagmi'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { erc20Abi, formatUnits, isAddress, zeroAddress, type Address } from '~/chains'
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

function ConnectInline({ onConnect }: { onConnect: () => void }): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, padding: '10px 0' }}>
      <div style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink2 }}>
        Connect a wallet to register a code and track earnings.
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

  const registerLabel = !deployed
    ? 'Not available on this network'
    : !connected
      ? 'Connect wallet to register'
      : registerPending
        ? 'Confirm in wallet…'
        : status === 'yours'
          ? 'Already registered to you'
          : status === 'taken'
            ? 'Code taken'
            : 'Register code'

  /* ---------------------------------------------------------------- earnings / claim */
  const wrappedNative = chainId ? WRAPPED_NATIVE_CURRENCY[chainId] : undefined
  const [tokenAddr, setTokenAddr] = useState('')
  const validToken = isAddress(tokenAddr)

  const decimalsRead = useReadContract({
    address: assume0xAddress(validToken ? tokenAddr : undefined),
    chainId,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: deployed && validToken },
  })
  const tokenDecimals = decimalsRead.data as number | undefined

  const symbolRead = useReadContract({
    address: assume0xAddress(validToken ? tokenAddr : undefined),
    chainId,
    abi: erc20Abi,
    functionName: 'symbol',
    query: { enabled: deployed && validToken },
  })
  const tokenSymbol = symbolRead.data as string | undefined

  const claimableRead = useReadContract({
    address: router,
    chainId,
    abi: referralRouterAbi,
    functionName: 'claimable',
    args: hash && validToken ? [hash, assume0xAddress(tokenAddr) as Address] : undefined,
    query: { enabled: deployed && Boolean(hash) && validToken },
  })
  const claimableAmt = claimableRead.data as bigint | undefined

  const claimableLabel =
    !deployed || !hash || !validToken
      ? '—'
      : claimableAmt !== undefined && tokenDecimals !== undefined
        ? `${formatUnits(claimableAmt, tokenDecimals)} ${tokenSymbol ?? ''}`.trim()
        : claimableRead.isLoading
          ? '…'
          : '—'

  const { writeContractAsync: writeClaim, isPending: claimPending } = useWriteContract()
  const hasClaimable = claimableAmt !== undefined && claimableAmt > 0n
  const canClaim = deployed && connected && Boolean(hash) && validToken && hasClaimable && !claimPending
  const onClaim = async (): Promise<void> => {
    if (!connected) {
      onConnect()
      return
    }
    if (!router || !hash || !validToken) {
      return
    }
    await writeClaim({
      address: router,
      chainId,
      abi: referralRouterAbi,
      functionName: 'claim',
      args: [hash, assume0xAddress(tokenAddr) as Address],
    })
  }

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
    <div style={{ padding: '20px 24px 40px' }}>
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
          {feeValue && feeValue !== '—' ? `${feeValue} of swap fee` : ''}
        </span>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink2, marginBottom: 18, maxWidth: 600, lineHeight: 1.5 }}>
        Register a referral code and earn a share of the swap fee on every trade routed with your code. Share your link —
        the code is captured automatically when someone lands on HookSwap with it.
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
            <StepLabel index="01" label="Your referral code" note={deployed ? undefined : 'not live'} />
            {!deployed ? (
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
            <SummaryRow label="Network" value={chainLabel} />
            <PrimaryButton label={registerLabel} onClick={() => void onRegister()} disabled={deployed ? !canRegister && connected : true} />
            {deployed ? (
              <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, marginTop: 10, lineHeight: 1.5 }}>
                Registering claims the code on-chain and sets your connected wallet as the claim wallet. Fees accrued to
                the code are withdrawn to it.
              </div>
            ) : null}
          </Panel>
        </div>

        {/* Earnings / claim */}
        <div style={{ flex: '1 1 340px', minWidth: 0 }}>
          <Panel>
            <StepLabel index="02" label="Earnings" note={deployed ? undefined : 'not live'} />
            {!deployed ? (
              <NotLiveNote chainLabel={chainLabel} />
            ) : !connected ? (
              <ConnectInline onConnect={onConnect} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontFamily: SANS, fontSize: 12, color: terminalColors.ink2, lineHeight: 1.5 }}>
                  Fees accrue per token. Enter a token address to see what your code has earned in that token, then claim
                  it to your claim wallet.
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                    <FieldLabel>Token address</FieldLabel>
                    {wrappedNative?.address ? (
                      <button
                        type="button"
                        onClick={() => setTokenAddr(wrappedNative.address)}
                        style={{
                          fontFamily: SANS,
                          fontSize: 11,
                          fontWeight: 600,
                          color: terminalColors.greenDeep,
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        Use {wrappedNative.symbol ?? 'wrapped native'}
                      </button>
                    ) : null}
                  </div>
                  <TextField value={tokenAddr} onChange={setTokenAddr} placeholder="0x…" />
                  {tokenAddr !== '' && !validToken ? (
                    <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, marginTop: 5 }}>
                      Enter a valid token address.
                    </div>
                  ) : null}
                </div>

                <div
                  style={{
                    border: `1px solid ${terminalColors.line}`,
                    borderRadius: 12,
                    background: terminalColors.panel,
                    padding: '13px 14px',
                  }}
                >
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt, marginBottom: 5 }}>
                    Claimable{!hash ? ' (enter a code above)' : ''}
                  </div>
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 20,
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      color: hasClaimable ? terminalColors.greenUp : terminalColors.ink,
                    }}
                  >
                    {claimableLabel}
                  </div>
                </div>

                <PrimaryButton
                  label={claimPending ? 'Confirm in wallet…' : hasClaimable ? 'Claim' : 'Nothing to claim'}
                  onClick={() => void onClaim()}
                  disabled={!canClaim}
                />
                {hash && validToken && !hasClaimable && claimableAmt !== undefined ? (
                  <div style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.faint, lineHeight: 1.5 }}>
                    No fees accrued for this code in this token yet.
                  </div>
                ) : null}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
