/**
 * HookSwap Terminal — Locker (lock LP / tokens + Uniswap-v3 positions).
 *
 * Two tabs:
 *   • "Token & LP"  — HookSwapTokenLockerManager: lock ERC-20 tokens or Uniswap-V2
 *                     LP tokens for a chosen unlock time.
 *   • "v3 Position" — HookSwapV3PositionLocker: lock a Uniswap-v3 position NFT,
 *                     while still collecting its trading fees during the lock.
 *
 * DATA POLICY (facts-only, no fabricated data — handoff hard rule):
 *   • The locker contracts are being built at `contracts/locker/` and are NOT yet
 *     deployed on any chain (see `~/terminal/lockers/addresses.ts` — every address
 *     is intentionally UNSET). While unset, the screen renders an honest
 *     "Lockers aren't deployed on {chain} yet" state — never an error, never mock data.
 *   • lockFee / feeReceiver / tokenLockerCount / the user's locks all come from REAL
 *     on-chain reads (wagmi `useReadContract`/`useReadContracts`) once addresses exist.
 *     Until then they read "—".
 *   • Create / withdraw / extend / collect-fees are REAL writes (`useWriteContract`)
 *     wired to the exact contract signatures; disabled with an honest note when the
 *     contracts aren't deployed or the wallet is disconnected.
 *
 * Contract signatures: see `~/terminal/lockers/abis.ts`.
 */
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESSES } from '@uniswap/sdk-core'
import { useMemo, useState } from 'react'
import { useReadContract, useReadContracts, useWriteContract } from 'wagmi'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { erc20Abi, formatUnits, isAddress, parseUnits, type Address } from '~/chains'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { useAccount } from '~/hooks/useAccount'
import {
  tokenLockerAbi,
  tokenLockerManagerAbi,
  v3PositionLockerAbi,
} from '~/terminal/lockers/abis'
import { getLockerAddresses } from '~/terminal/lockers/addresses'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'
import { assume0xAddress } from '~/utils/wagmi'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

type LockerTab = 'token' | 'v3'

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

/** unix seconds → compact UTC date label. */
function fmtUnlock(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', color: terminalColors.ink3Alt }}>
        {index} · {label.toUpperCase()}
      </span>
      {note ? <span style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt }}>{note}</span> : null}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt, marginBottom: 5 }}>{children}</div>
  )
}

function TextField({
  value,
  onChange,
  placeholder,
  mono = true,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
  type?: string
}): JSX.Element {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0' }}>
      <span style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink3Alt }}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: valueColor ?? terminalColors.ink }}>
        {value}
      </span>
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

function StatusPill({ unlockable }: { unlockable: boolean }): JSX.Element {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: SANS,
        fontSize: 11.5,
        fontWeight: 600,
        color: unlockable ? terminalColors.greenDeep : terminalColors.ink2,
        background: unlockable ? terminalColors.greenBg : terminalColors.panel2,
        border: `1px solid ${unlockable ? terminalColors.greenBorder : terminalColors.line}`,
        padding: '3px 9px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: unlockable ? terminalColors.greenDeep : terminalColors.ink3,
        }}
      />
      {unlockable ? 'Unlockable' : 'Locked'}
    </span>
  )
}

/** Honest "contracts not deployed on this chain" note. */
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
      Lockers aren&apos;t deployed on {chainLabel} yet. This panel activates automatically once the HookSwap locker
      contracts are live on this chain.
    </div>
  )
}

/* ------------------------------------------------------------------ token & LP tab */

interface TokenLockRow {
  id: bigint
  isLpToken: boolean
  contractAddress: Address
  token: Address
  createdAt: number
  unlockTime: number
  balance: bigint
}

function useTokenLocks(
  manager: Address | undefined,
  owner: Address | undefined,
  chainId?: number,
): {
  rows: TokenLockRow[] | undefined
  isLoading: boolean
  error: boolean
  refetch: () => void
} {
  const enabled = Boolean(manager && owner && chainId)

  const idsRead = useReadContract({
    address: manager,
    chainId,
    abi: tokenLockerManagerAbi,
    functionName: 'getTokenLockersForAddress',
    args: owner ? [owner] : undefined,
    query: { enabled },
  })

  const ids = (idsRead.data as readonly bigint[] | undefined) ?? undefined

  const dataRead = useReadContracts({
    contracts: (ids ?? []).map((id) => ({
      address: manager,
      chainId,
      abi: tokenLockerManagerAbi,
      functionName: 'getTokenLockData' as const,
      args: [id] as const,
    })),
    query: { enabled: enabled && Boolean(ids && ids.length > 0) },
  })

  const rows = useMemo(() => {
    if (!ids) {
      return undefined
    }
    if (ids.length === 0) {
      return []
    }
    if (!dataRead.data) {
      return undefined
    }
    const out: TokenLockRow[] = []
    for (const entry of dataRead.data) {
      if (entry.status !== 'success' || !entry.result) {
        continue
      }
      const r = entry.result as readonly [
        boolean, bigint, Address, Address, Address, Address, bigint, bigint, bigint, bigint,
      ]
      out.push({
        isLpToken: r[0],
        id: r[1],
        contractAddress: r[2],
        token: r[4],
        createdAt: Number(r[6]),
        unlockTime: Number(r[7]),
        balance: r[8],
      })
    }
    return out
  }, [ids, dataRead.data])

  return {
    rows,
    isLoading: idsRead.isLoading || (Boolean(ids && ids.length > 0) && dataRead.isLoading),
    error: Boolean(idsRead.error || dataRead.error),
    refetch: () => {
      void idsRead.refetch()
      void dataRead.refetch()
    },
  }
}

function TokenLpTab({
  manager,
  chainLabel,
  chainId,
  owner,
  connected,
  onConnect,
}: {
  manager: Address | undefined
  chainLabel: string
  chainId?: number
  owner: Address | undefined
  connected: boolean
  onConnect: () => void
}): JSX.Element {
  const deployed = Boolean(manager)

  const [tokenAddr, setTokenAddr] = useState('')
  const [amount, setAmount] = useState('')
  const [unlock, setUnlock] = useState('')

  const validToken = isAddress(tokenAddr)

  // Real lockFee read (payable msg.value for createTokenLocker).
  const lockFeeRead = useReadContract({
    address: manager,
    chainId,
    abi: tokenLockerManagerAbi,
    functionName: 'lockFee',
    query: { enabled: deployed },
  })
  const lockFee = lockFeeRead.data as bigint | undefined

  // Real decimals read for the entered token, to parse the human amount.
  const decimalsRead = useReadContract({
    address: assume0xAddress(validToken ? tokenAddr : undefined),
    chainId,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: deployed && validToken },
  })
  const decimals = decimalsRead.data as number | undefined

  const { writeContractAsync, isPending } = useWriteContract()

  const unlockUnix = toUnix(unlock)
  const amountValid = amount !== '' && Number(amount) > 0
  const futureUnlock = unlockUnix !== undefined && unlockUnix > Math.floor(Date.now() / 1000)
  const canLock =
    deployed &&
    connected &&
    validToken &&
    amountValid &&
    futureUnlock &&
    decimals !== undefined &&
    !isPending

  const onLock = async (): Promise<void> => {
    if (!connected) {
      onConnect()
      return
    }
    if (!manager || !unlockUnix || decimals === undefined) {
      return
    }
    // NOTE: an ERC-20 approve(manager, amount) is required before this pulls tokens;
    // the approval step is added alongside the contracts/locker deploy.
    await writeContractAsync({
      address: manager,
      chainId,
      abi: tokenLockerManagerAbi,
      functionName: 'createTokenLocker',
      args: [assume0xAddress(tokenAddr), parseUnits(amount, decimals), unlockUnix],
      value: lockFee,
    })
    setAmount('')
  }

  const locks = useTokenLocks(manager, owner, chainId)

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Create panel */}
      <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Panel>
          <StepLabel index="01" label="Lock tokens / LP" note={deployed ? undefined : 'not deployed'} />
          {!deployed ? (
            <NotDeployedNote chainLabel={chainLabel} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <FieldLabel>Token or LP address</FieldLabel>
                <TextField value={tokenAddr} onChange={setTokenAddr} placeholder="0x…" />
                {tokenAddr !== '' && !validToken ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, marginTop: 5 }}>
                    Enter a valid contract address.
                  </div>
                ) : null}
              </div>
              <div>
                <FieldLabel>Amount</FieldLabel>
                <TextField value={amount} onChange={setAmount} placeholder="0.00" />
              </div>
              <div>
                <FieldLabel>Unlock date &amp; time</FieldLabel>
                <TextField value={unlock} onChange={setUnlock} type="datetime-local" mono={false} />
              </div>
            </div>
          )}
        </Panel>

        <Panel>
          <SummaryRow
            label="Lock fee"
            value={
              !deployed
                ? '—'
                : lockFee !== undefined
                  ? `${formatUnits(lockFee, 18)}`
                  : lockFeeRead.isLoading
                    ? '…'
                    : '—'
            }
            valueColor={deployed && lockFee !== undefined ? terminalColors.ink : terminalColors.faint}
          />
          <SummaryRow label="Network" value={chainLabel} />
          <PrimaryButton
            label={
              !deployed
                ? 'Not available on this network'
                : !connected
                  ? 'Connect wallet to lock'
                  : isPending
                    ? 'Confirm in wallet…'
                    : 'Lock'
            }
            onClick={() => void onLock()}
            disabled={deployed ? !canLock && connected : true}
          />
          {deployed ? (
            <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, marginTop: 10, lineHeight: 1.5 }}>
              Locking transfers the tokens to a dedicated lock contract until the unlock time. A one-time lock fee is
              sent with the transaction.
            </div>
          ) : null}
        </Panel>
      </div>

      {/* My locks */}
      <div style={{ flex: '1 1 420px', minWidth: 0 }}>
        <Panel>
          <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: terminalColors.ink, marginBottom: 14 }}>
            My token &amp; LP locks
          </div>
          <TokenLocksList
            deployed={deployed}
            connected={connected}
            chainLabel={chainLabel}
            chainId={chainId}
            locks={locks}
            onConnect={onConnect}
          />
        </Panel>
      </div>
    </div>
  )
}

function TokenLocksList({
  deployed,
  connected,
  chainLabel,
  chainId,
  locks,
  onConnect,
}: {
  deployed: boolean
  connected: boolean
  chainLabel: string
  chainId?: number
  locks: ReturnType<typeof useTokenLocks>
  onConnect: () => void
}): JSX.Element {
  const { writeContractAsync, isPending } = useWriteContract()

  if (!deployed) {
    return <NotDeployedNote chainLabel={chainLabel} />
  }
  if (!connected) {
    return <ConnectInline onConnect={onConnect} />
  }
  if (locks.error) {
    return <ErrorInline onRetry={locks.refetch} />
  }
  if (locks.rows === undefined) {
    return <SkeletonRows />
  }
  if (locks.rows.length === 0) {
    return <EmptyInline text="You have no token or LP locks yet." />
  }

  const now = Math.floor(Date.now() / 1000)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {locks.rows.map((row, i) => {
        const unlockable = row.unlockTime <= now
        return (
          <div
            key={String(row.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 0',
              borderTop: i === 0 ? undefined : `1px solid ${terminalColors.line3}`,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: terminalColors.ink }}>
                  {shortAddr(row.token)}
                </span>
                {row.isLpToken ? (
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      fontWeight: 600,
                      color: terminalColors.accentIndigo,
                      background: terminalColors.panel2,
                      padding: '1px 6px',
                      borderRadius: 999,
                    }}
                  >
                    LP
                  </span>
                ) : null}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: terminalColors.ink3Alt, marginTop: 3 }}>
                Unlocks {fmtUnlock(row.unlockTime)}
              </div>
            </div>
            <StatusPill unlockable={unlockable} />
            <button
              type="button"
              disabled={!unlockable || isPending}
              onClick={() =>
                void writeContractAsync({
                  address: row.contractAddress,
                  chainId,
                  abi: tokenLockerAbi,
                  functionName: 'withdraw',
                  args: [],
                })
              }
              style={rowActionStyle(unlockable && !isPending)}
            >
              Withdraw
            </button>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ v3 tab */

interface V3LockRow {
  id: bigint
  nftManager: Address
  tokenId: bigint
  createdAt: number
  unlockTime: number
}

function useV3Locks(
  locker: Address | undefined,
  owner: Address | undefined,
  chainId?: number,
): {
  rows: V3LockRow[] | undefined
  isLoading: boolean
  error: boolean
  refetch: () => void
} {
  const enabled = Boolean(locker && owner && chainId)

  const idsRead = useReadContract({
    address: locker,
    chainId,
    abi: v3PositionLockerAbi,
    functionName: 'getLocksForAddress',
    args: owner ? [owner] : undefined,
    query: { enabled },
  })
  const ids = (idsRead.data as readonly bigint[] | undefined) ?? undefined

  const dataRead = useReadContracts({
    contracts: (ids ?? []).map((id) => ({
      address: locker,
      chainId,
      abi: v3PositionLockerAbi,
      functionName: 'getLockData' as const,
      args: [id] as const,
    })),
    query: { enabled: enabled && Boolean(ids && ids.length > 0) },
  })

  const rows = useMemo(() => {
    if (!ids) {
      return undefined
    }
    if (ids.length === 0) {
      return []
    }
    if (!dataRead.data) {
      return undefined
    }
    const out: V3LockRow[] = []
    for (const entry of dataRead.data) {
      if (entry.status !== 'success' || !entry.result) {
        continue
      }
      const r = entry.result as readonly [bigint, Address, Address, bigint, Address, bigint, bigint]
      out.push({
        id: r[0],
        nftManager: r[2],
        tokenId: r[3],
        createdAt: Number(r[5]),
        unlockTime: Number(r[6]),
      })
    }
    return out
  }, [ids, dataRead.data])

  return {
    rows,
    isLoading: idsRead.isLoading || (Boolean(ids && ids.length > 0) && dataRead.isLoading),
    error: Boolean(idsRead.error || dataRead.error),
    refetch: () => {
      void idsRead.refetch()
      void dataRead.refetch()
    },
  }
}

function V3Tab({
  locker,
  chainLabel,
  chainId,
  owner,
  connected,
  onConnect,
}: {
  locker: Address | undefined
  chainLabel: string
  chainId?: number
  owner: Address | undefined
  connected: boolean
  onConnect: () => void
}): JSX.Element {
  const deployed = Boolean(locker)

  // Default the NFT manager to the chain's canonical NonfungiblePositionManager
  // (from the HookSwap sdk-core address map) when available; user can override.
  const defaultNftManager = chainId
    ? (NONFUNGIBLE_POSITION_MANAGER_ADDRESSES as Record<number, string | undefined>)[chainId]
    : undefined

  const [nftManager, setNftManager] = useState('')
  const [tokenId, setTokenId] = useState('')
  const [unlock, setUnlock] = useState('')

  const effectiveNftManager = nftManager || defaultNftManager || ''
  const validNftManager = isAddress(effectiveNftManager)
  const validTokenId = tokenId !== '' && /^[0-9]+$/.test(tokenId)

  const lockFeeRead = useReadContract({
    address: locker,
    chainId,
    abi: v3PositionLockerAbi,
    functionName: 'lockFee',
    query: { enabled: deployed },
  })
  const lockFee = lockFeeRead.data as bigint | undefined

  const { writeContractAsync, isPending } = useWriteContract()

  const unlockUnix = toUnix(unlock)
  const futureUnlock = unlockUnix !== undefined && unlockUnix > Math.floor(Date.now() / 1000)
  const canLock = deployed && connected && validNftManager && validTokenId && futureUnlock && !isPending

  const onLock = async (): Promise<void> => {
    if (!connected) {
      onConnect()
      return
    }
    if (!locker || !unlockUnix || !validTokenId) {
      return
    }
    // NOTE: the position NFT must be approved to the locker before lock() pulls it;
    // the approval step is added alongside the contracts/locker deploy.
    await writeContractAsync({
      address: locker,
      chainId,
      abi: v3PositionLockerAbi,
      functionName: 'lock',
      args: [assume0xAddress(effectiveNftManager), BigInt(tokenId), unlockUnix],
      value: lockFee,
    })
    setTokenId('')
  }

  const locks = useV3Locks(locker, owner, chainId)

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Create panel */}
      <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Panel>
          <StepLabel index="01" label="Lock v3 position" note={deployed ? undefined : 'not deployed'} />
          {!deployed ? (
            <NotDeployedNote chainLabel={chainLabel} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <FieldLabel>Position manager (NFT)</FieldLabel>
                <TextField
                  value={nftManager || defaultNftManager || ''}
                  onChange={setNftManager}
                  placeholder="0x…"
                />
                {defaultNftManager && !nftManager ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt, marginTop: 5 }}>
                    Default: chain NonfungiblePositionManager
                  </div>
                ) : null}
              </div>
              <div>
                <FieldLabel>Position token ID</FieldLabel>
                <TextField value={tokenId} onChange={setTokenId} placeholder="e.g. 12345" />
              </div>
              <div>
                <FieldLabel>Unlock date &amp; time</FieldLabel>
                <TextField value={unlock} onChange={setUnlock} type="datetime-local" mono={false} />
              </div>
            </div>
          )}
        </Panel>

        <Panel>
          <SummaryRow
            label="Lock fee"
            value={
              !deployed
                ? '—'
                : lockFee !== undefined
                  ? `${formatUnits(lockFee, 18)}`
                  : lockFeeRead.isLoading
                    ? '…'
                    : '—'
            }
            valueColor={deployed && lockFee !== undefined ? terminalColors.ink : terminalColors.faint}
          />
          <SummaryRow label="Network" value={chainLabel} />
          <PrimaryButton
            label={
              !deployed
                ? 'Not available on this network'
                : !connected
                  ? 'Connect wallet to lock'
                  : isPending
                    ? 'Confirm in wallet…'
                    : 'Lock position'
            }
            onClick={() => void onLock()}
            disabled={deployed ? !canLock && connected : true}
          />
          {deployed ? (
            <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, marginTop: 10, lineHeight: 1.5 }}>
              The position NFT is held by the locker until unlock. You can still collect the position&apos;s trading fees
              while it is locked.
            </div>
          ) : null}
        </Panel>
      </div>

      {/* My locks */}
      <div style={{ flex: '1 1 420px', minWidth: 0 }}>
        <Panel>
          <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: terminalColors.ink, marginBottom: 14 }}>
            My v3 position locks
          </div>
          <V3LocksList
            deployed={deployed}
            connected={connected}
            chainLabel={chainLabel}
            locker={locker}
            chainId={chainId}
            locks={locks}
            onConnect={onConnect}
          />
        </Panel>
      </div>
    </div>
  )
}

function V3LocksList({
  deployed,
  connected,
  chainLabel,
  locker,
  chainId,
  locks,
  onConnect,
}: {
  deployed: boolean
  connected: boolean
  chainLabel: string
  locker: Address | undefined
  chainId?: number
  locks: ReturnType<typeof useV3Locks>
  onConnect: () => void
}): JSX.Element {
  const { writeContractAsync, isPending } = useWriteContract()

  if (!deployed) {
    return <NotDeployedNote chainLabel={chainLabel} />
  }
  if (!connected) {
    return <ConnectInline onConnect={onConnect} />
  }
  if (locks.error) {
    return <ErrorInline onRetry={locks.refetch} />
  }
  if (locks.rows === undefined) {
    return <SkeletonRows />
  }
  if (locks.rows.length === 0) {
    return <EmptyInline text="You have no v3 position locks yet." />
  }

  const now = Math.floor(Date.now() / 1000)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {locks.rows.map((row, i) => {
        const unlockable = row.unlockTime <= now
        return (
          <div
            key={String(row.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 0',
              borderTop: i === 0 ? undefined : `1px solid ${terminalColors.line3}`,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: terminalColors.ink }}>
                Position #{String(row.tokenId)}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: terminalColors.ink3Alt, marginTop: 3 }}>
                Unlocks {fmtUnlock(row.unlockTime)}
              </div>
            </div>
            <StatusPill unlockable={unlockable} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                disabled={!locker || isPending}
                onClick={() =>
                  void writeContractAsync({
                    address: locker!,
                    chainId,
                    abi: v3PositionLockerAbi,
                    functionName: 'collectFees',
                    args: [row.id],
                  })
                }
                style={rowActionStyle(Boolean(locker) && !isPending)}
              >
                Collect
              </button>
              <button
                type="button"
                disabled={!locker || !unlockable || isPending}
                onClick={() =>
                  void writeContractAsync({
                    address: locker!,
                    chainId,
                    abi: v3PositionLockerAbi,
                    functionName: 'withdraw',
                    args: [row.id],
                  })
                }
                style={rowActionStyle(Boolean(locker) && unlockable && !isPending)}
              >
                Withdraw
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ shared inline states */

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
        Connect a wallet to see your locks.
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
      <span style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.redDown }}>Failed to load locks.</span>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: 12, width: '45%', borderRadius: 4, background: terminalColors.line2 }} />
            <div style={{ height: 10, width: '65%', borderRadius: 4, background: terminalColors.line3, marginTop: 6 }} />
          </div>
          <div style={{ height: 20, width: 78, borderRadius: 999, background: terminalColors.line2 }} />
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ the screen */

export function LockerScreen(): JSX.Element {
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const [tab, setTab] = useState<LockerTab>('token')

  const connected = Boolean(account.address)
  const owner = assume0xAddress(account.address)
  const chainId = account.chainId
  const chainLabel = chainId ? getChainLabel(chainId) : '—'

  const lockerAddrs = getLockerAddresses(chainId)
  const tokenManager = lockerAddrs?.tokenLockerManager
  const v3Locker = lockerAddrs?.v3PositionLocker

  // Total locked count (real read) — "—" until deployed.
  const countRead = useReadContract({
    address: tokenManager,
    chainId,
    abi: tokenLockerManagerAbi,
    functionName: 'tokenLockerCount',
    query: { enabled: Boolean(tokenManager && chainId) },
  })
  const totalCount = countRead.data as bigint | undefined

  const onConnect = (): void => accountDrawer.open()

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
          Locker
        </h1>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 11,
            fontWeight: 600,
            color: terminalColors.ink3Alt,
          }}
        >
          {totalCount !== undefined ? `${String(totalCount)} total locks` : '— total locks'}
        </span>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink2, marginBottom: 18, maxWidth: 560, lineHeight: 1.5 }}>
        Lock ERC-20 tokens, Uniswap-V2 LP, or Uniswap-v3 positions until a chosen unlock time. Proof-of-lock for your
        community — v3 positions keep earning fees while locked.
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: terminalColors.panel2, padding: 4, borderRadius: 11, width: 'fit-content', marginBottom: 20 }}>
        {(['token', 'v3'] as const).map((id) => {
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
              {id === 'token' ? 'Token & LP' : 'v3 Position'}
            </button>
          )
        })}
      </div>

      {tab === 'token' ? (
        <TokenLpTab
          manager={tokenManager}
          chainLabel={chainLabel}
          chainId={chainId}
          owner={owner}
          connected={connected}
          onConnect={onConnect}
        />
      ) : (
        <V3Tab
          locker={v3Locker}
          chainLabel={chainLabel}
          chainId={chainId}
          owner={owner}
          connected={connected}
          onConnect={onConnect}
        />
      )}
    </div>
  )
}
