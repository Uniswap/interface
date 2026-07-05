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
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { erc20Abi, formatUnits, isAddress, parseUnits, type Address } from '~/chains'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { useAccount } from '~/hooks/useAccount'
import { StatCard } from '~/terminal/components/StatCard'
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {locks.rows.map((row, i) => (
        <V3LockRowItem key={String(row.id)} row={row} locker={locker} chainId={chainId} isFirst={i === 0} />
      ))}
    </div>
  )
}

/**
 * A single v3 position-lock row with its real action set: Collect fees (any time),
 * Extend (inline datetime → `extend(lockId, newUnlockTime)`), and Withdraw (once
 * unlockable). All three are real writes wired to the exact v3PositionLocker ABI.
 */
function V3LockRowItem({
  row,
  locker,
  chainId,
  isFirst,
}: {
  row: V3LockRow
  locker: Address | undefined
  chainId?: number
  isFirst: boolean
}): JSX.Element {
  const { writeContractAsync, isPending } = useWriteContract()
  const [extendOpen, setExtendOpen] = useState(false)
  const [extendValue, setExtendValue] = useState('')

  const now = Math.floor(Date.now() / 1000)
  const unlockable = row.unlockTime <= now
  const extendUnix = toUnix(extendValue)
  // A valid extend must push the unlock strictly later than the current unlock time.
  const canExtend = Boolean(locker) && extendUnix !== undefined && extendUnix > row.unlockTime && !isPending

  const onCollect = (): void => {
    if (!locker) {
      return
    }
    void writeContractAsync({
      address: locker,
      chainId,
      abi: v3PositionLockerAbi,
      functionName: 'collectFees',
      args: [row.id],
    })
  }

  const onWithdraw = (): void => {
    if (!locker) {
      return
    }
    void writeContractAsync({
      address: locker,
      chainId,
      abi: v3PositionLockerAbi,
      functionName: 'withdraw',
      args: [row.id],
    })
  }

  const onExtend = (): void => {
    if (!locker || extendUnix === undefined) {
      return
    }
    void writeContractAsync({
      address: locker,
      chainId,
      abi: v3PositionLockerAbi,
      functionName: 'extend',
      args: [row.id, extendUnix],
    })
    setExtendOpen(false)
    setExtendValue('')
  }

  return (
    <div style={{ padding: '12px 0', borderTop: isFirst ? undefined : `1px solid ${terminalColors.line3}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: terminalColors.ink }}>
            Position #{String(row.tokenId)}
          </div>
          <div style={{ fontFamily: SANS, fontSize: 12, color: terminalColors.ink3Alt, marginTop: 3 }}>
            Unlocks {fmtUnlock(row.unlockTime)}
          </div>
        </div>
        <StatusPill unlockable={unlockable} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            type="button"
            disabled={!locker || isPending}
            onClick={onCollect}
            style={rowActionStyle(Boolean(locker) && !isPending)}
          >
            Collect fees
          </button>
          <button
            type="button"
            disabled={!locker || isPending}
            onClick={() => setExtendOpen((v) => !v)}
            style={rowNeutralActionStyle(Boolean(locker) && !isPending)}
          >
            Extend
          </button>
          <button
            type="button"
            disabled={!locker || !unlockable || isPending}
            onClick={onWithdraw}
            style={rowActionStyle(Boolean(locker) && unlockable && !isPending)}
          >
            Withdraw
          </button>
        </div>
      </div>

      {extendOpen ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
          <input
            value={extendValue}
            onChange={(e) => setExtendValue(e.target.value)}
            type="datetime-local"
            style={{
              flex: 1,
              minWidth: 0,
              boxSizing: 'border-box',
              border: `1px solid ${terminalColors.line}`,
              borderRadius: 9,
              background: terminalColors.bg,
              padding: '8px 10px',
              fontFamily: SANS,
              fontSize: 12.5,
              color: terminalColors.ink,
              outline: 'none',
            }}
          />
          <button
            type="button"
            disabled={!canExtend}
            onClick={onExtend}
            style={rowActionStyle(canExtend)}
          >
            {isPending ? 'Confirm…' : 'Confirm extend'}
          </button>
        </div>
      ) : null}
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

/** Neutral (non-primary) row action — e.g. "Extend" toggles an inline field. */
function rowNeutralActionStyle(enabled: boolean): React.CSSProperties {
  return {
    fontFamily: SANS,
    fontSize: 12,
    fontWeight: 600,
    color: enabled ? terminalColors.ink2 : terminalColors.faint,
    background: terminalColors.bg,
    border: `1px solid ${terminalColors.line}`,
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

/* ------------------------------------------------------------------ graphics + analytics */

/** Small padlock glyph for empty states (stroked, muted ink). */
function PadlockGraphic({ size = 34 }: { size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="10.2" width="16" height="10.8" rx="2.6" stroke={terminalColors.ink3} strokeWidth="1.5" />
      <path d="M7.6 10.2V7.4a4.4 4.4 0 0 1 8.8 0v2.8" stroke={terminalColors.ink3} strokeWidth="1.5" />
      <circle cx="12" cy="15" r="1.5" fill={terminalColors.ink3} />
    </svg>
  )
}

interface LockBreakdown {
  locked: number
  unlockable: number
  total: number
}

/**
 * Lock analytics card. Time-series "value locked / locks over time" needs the
 * HookSwap indexer (not live) → honest empty state, never a fabricated series.
 * When the user has REAL locks, a live Locked/Unlockable status split IS shown
 * (computed from on-chain unlock times).
 */
function LockAnalyticsCard({
  breakdown,
  loading,
}: {
  breakdown?: LockBreakdown
  loading: boolean
}): JSX.Element {
  const hasData = Boolean(breakdown && breakdown.total > 0)
  const lockedPct = hasData ? (breakdown!.locked / breakdown!.total) * 100 : 0
  const unlockablePct = hasData ? (breakdown!.unlockable / breakdown!.total) * 100 : 0

  return (
    <Panel>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: terminalColors.ink }}>
          Lock analytics
        </span>
        <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', color: terminalColors.ink3Alt }}>
          {hasData ? 'YOUR LOCKS' : 'INDEXER PENDING'}
        </span>
      </div>

      {loading ? (
        <div style={{ height: 14, borderRadius: 999, background: terminalColors.line2 }} aria-busy="true" />
      ) : hasData ? (
        <>
          <div style={{ display: 'flex', height: 14, borderRadius: 999, overflow: 'hidden', background: terminalColors.panel2 }}>
            {breakdown!.locked > 0 ? (
              <div title={`Locked · ${breakdown!.locked}`} style={{ width: `${lockedPct}%`, background: terminalColors.ink3 }} />
            ) : null}
            {breakdown!.unlockable > 0 ? (
              <div title={`Unlockable · ${breakdown!.unlockable}`} style={{ width: `${unlockablePct}%`, background: terminalColors.greenUp }} />
            ) : null}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: terminalColors.ink3 }} />
              <span style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink2 }}>Locked</span>
              <span style={{ fontFamily: MONO, fontSize: 12.5, color: terminalColors.ink }}>{breakdown!.locked}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: terminalColors.greenUp }} />
              <span style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink2 }}>Unlockable</span>
              <span style={{ fontFamily: MONO, fontSize: 12.5, color: terminalColors.greenDeep }}>{breakdown!.unlockable}</span>
            </div>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, marginTop: 12, lineHeight: 1.5 }}>
            Live status from your on-chain locks. Value-locked and locks-over-time charts arrive with the HookSwap indexer.
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8, padding: '18px 12px' }}>
          <PadlockGraphic />
          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: terminalColors.ink2 }}>
            Lock analytics go live with the HookSwap indexer.
          </div>
          <div style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.faint, maxWidth: 300, lineHeight: 1.5 }}>
            Historical value-locked and lock-count charts need the indexer (not live yet). Your live locks appear in the
            tabs below.
          </div>
        </div>
      )}
    </Panel>
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
  const deployed = Boolean(tokenManager || v3Locker)

  // Total locked count (real read) — "—" until deployed.
  const countRead = useReadContract({
    address: tokenManager,
    chainId,
    abi: tokenLockerManagerAbi,
    functionName: 'tokenLockerCount',
    query: { enabled: Boolean(tokenManager && chainId) },
  })
  const totalCount = countRead.data as bigint | undefined

  // Lock fee (real read) — denominated in the chain's native gas token.
  const lockFeeRead = useReadContract({
    address: tokenManager,
    chainId,
    abi: tokenLockerManagerAbi,
    functionName: 'lockFee',
    query: { enabled: Boolean(tokenManager && chainId) },
  })
  const lockFee = lockFeeRead.data as bigint | undefined
  const native = chainId ? getChainInfo(chainId).nativeCurrency : undefined

  // The user's real locks (both kinds) — drive "Your locks" + the status split.
  // wagmi dedupes these identical reads with the per-tab copies (same query keys).
  const tokenLocks = useTokenLocks(tokenManager, owner, chainId)
  const v3Locks = useV3Locks(v3Locker, owner, chainId)

  const locksLoading =
    connected &&
    deployed &&
    !tokenLocks.error &&
    !v3Locks.error &&
    (tokenLocks.rows === undefined || v3Locks.rows === undefined)

  const breakdown = useMemo((): LockBreakdown | undefined => {
    if (!connected || !deployed) {
      return undefined
    }
    const rows = [...(tokenLocks.rows ?? []), ...(v3Locks.rows ?? [])]
    if (rows.length === 0) {
      return { locked: 0, unlockable: 0, total: 0 }
    }
    const now = Math.floor(Date.now() / 1000)
    const unlockable = rows.filter((r) => r.unlockTime <= now).length
    return { locked: rows.length - unlockable, unlockable, total: rows.length }
  }, [connected, deployed, tokenLocks.rows, v3Locks.rows])

  const yourLocksCount = (tokenLocks.rows?.length ?? 0) + (v3Locks.rows?.length ?? 0)

  // Stat-tile display values (honest "—" when disconnected / not deployed).
  const totalLocksValue = !deployed ? '—' : totalCount !== undefined ? String(totalCount) : undefined
  const yourLocksValue = !connected || !deployed ? '—' : locksLoading ? undefined : String(yourLocksCount)
  const lockFeeValue = !deployed
    ? '—'
    : lockFee !== undefined
      ? `${formatUnits(lockFee, native?.decimals ?? 18)} ${native?.symbol ?? ''}`.trim()
      : undefined
  const networkValue = !connected ? '—' : deployed ? chainLabel : 'Not live'

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

      {/* Stat tiles — real contract reads (honest "—" when not deployed / disconnected). */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <StatCard
          size="lg"
          label="Total locks"
          value={totalLocksValue}
          loading={deployed && countRead.isLoading && totalCount === undefined}
          error={countRead.error ? 'Failed to load' : undefined}
        />
        <StatCard size="lg" label="Your locks" value={yourLocksValue} loading={Boolean(locksLoading)} />
        <StatCard
          size="lg"
          label="Lock fee"
          value={lockFeeValue}
          loading={deployed && lockFeeRead.isLoading && lockFee === undefined}
          error={lockFeeRead.error ? 'Failed to load' : undefined}
        />
        <StatCard size="lg" label="Network" value={networkValue} valueColor={deployed ? 'up' : 'ink'} />
      </div>

      {/* Lock analytics — honest indexer-pending empty state, or a real status split. */}
      <div style={{ marginBottom: 20 }}>
        <LockAnalyticsCard breakdown={breakdown} loading={Boolean(locksLoading)} />
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
