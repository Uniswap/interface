/**
 * HookSwap Terminal — client-side one-shot pool launch (InstantPoolLauncherV2).
 *
 * Self-contained CLIENT-SIDE flow (NO backend, NO Permit2, NO approval): a single
 * `launch(cfg)` write against the deployed `InstantPoolLauncherV2` deploys a fresh token,
 * opens its v3 pool, and (optionally) performs the creator's dev-buy — all in one tx. See
 * `~/terminal/launchpad/abis` (ABI mirrors 0xCCaA…A3Bd).
 *
 * Semantics (mirrors the contract + `~/terminal/tokenfactory/useCreateToken`):
 *   • The `cfg` tuple is assembled from RAW inputs (the design exposes sqrtPriceX96 / ticks
 *     directly) — parsed to bigint (uint256/uint160), number (int24/uint16/uint8), and hex
 *     (bytes32 salt / addresses). Nothing is fabricated; every field is user-supplied.
 *   • `launchFeeWei()` is READ on-chain and forwarded together with `developerBuyWei` as
 *     `msg.value` (`value = launchFeeWei + developerBuyWei`) — exactly what the contract wants.
 *   • No `Launched` event exists in the verified interface, so a mined receipt carries no
 *     return value. The new launch is read back honestly via `launchCount()` →
 *     `getLaunch(count-1)` after confirmation, guarded to `creator == owner` — never a
 *     fabricated address.
 *   • When the launcher isn't deployed on the chain (design-only: it isn't), the screen
 *     renders an honest "not deployed" state — never a fake success.
 *
 * `useMyLaunches(owner)` reads `launchCount()` then batches `getLaunch(i)` over the most
 * recent ids (capped), filters to `creator == owner`, and reads `pendingEth(token)` per row
 * for the fee-claim view (`collect(token)` per launch + `withdrawPending()` global).
 *
 * All reads/writes are REAL (wagmi). A single write, so there is no approval gate.
 */
import { useEffect, useMemo, useState } from 'react'
import { useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { type Address, type Hash } from '~/chains'
import { instantPoolLauncherV2Abi } from '~/terminal/launchpad/abis'
import { getLaunchpadAddress } from '~/terminal/launchpad/addresses'

/** Zero bytes32 — the default salt when the user doesn't randomize one. */
export const ZERO_SALT = `0x${'0'.repeat(64)}` as const
/** Zero address — the `positions`/`getLaunch` sentinel for "unset". */
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
/** How many recent launches `useMyLaunches` scans back over (block-read budget). */
export const MY_LAUNCHES_SCAN = 50
/** int24 bounds — tick fields are raw int24. */
const INT24_MIN = -8_388_608
const INT24_MAX = 8_388_607

/** The raw `launch(cfg)` inputs, exactly as the form collects them (strings). */
export interface LaunchConfigInput {
  name: string
  symbol: string
  metadataUri: string
  /** Raw uint256 token supply (base units). */
  tokenSupply: string
  /** bytes32 salt (`0x` + 64 hex). Defaults to {@link ZERO_SALT}. */
  salt: string
  /** Raw uint160 sqrtPriceX96. */
  sqrtPriceX96: string
  /** Raw int24 (may be negative). */
  tickLower: string
  /** Raw int24 (may be negative). */
  tickUpper: string
  /** uint16 basis points. */
  creatorShareBps: string
  /** uint16 basis points. */
  teamBps: string
  teamRecipient: string
  feeRecipient: string
  /** uint8 dex selector. */
  dex: string
  /** Optional dev-buy — raw uint256 wei (default 0). */
  developerBuyWei: string
  /** Optional dev-buy — raw uint256 min-out (default 0). */
  developerBuyMinOut: string
  /** Optional dev-buy — raw uint256 unix deadline (default 0). */
  developerBuyDeadline: string
}

/** The typed `cfg` tuple passed to `launch` (viem-encodable). */
export interface LaunchConfigTuple {
  name: string
  symbol: string
  metadataUri: string
  tokenSupply: bigint
  salt: `0x${string}`
  sqrtPriceX96: bigint
  tickLower: number
  tickUpper: number
  creatorShareBps: number
  developerBuyWei: bigint
  developerBuyMinOut: bigint
  developerBuyDeadline: bigint
  feeRecipient: Address
  dex: number
  teamBps: number
  teamRecipient: Address
}

export interface UseLaunch {
  /** True when the chain has a deployed InstantPoolLauncherV2 (address present). */
  ready: boolean
  /** Resolved launcher address, or undefined when not deployed on this chain. */
  launcher?: Address
  /** Native launch fee (raw wei), or undefined while loading. */
  launchFeeWei?: bigint
  /** `msg.value` the launch will send: launchFeeWei + developerBuyWei (undefined while loading). */
  totalValue?: bigint
  /** Contract's default / max creator share (bps), or undefined while loading. */
  defaultCreatorShareBps?: number
  maxCreatorShareBps?: number
  /** The parsed cfg tuple, or undefined when inputs are incomplete/invalid. */
  cfg?: LaunchConfigTuple
  /** First blocking validation problem (human-readable), or undefined when valid. */
  validationError?: string

  inputsValid: boolean
  canLaunch: boolean
  launch: () => Promise<void>
  isWritePending: boolean
  launchHash?: Hash
  isConfirming: boolean
  isDone: boolean

  // Result, read back from getLaunch(count-1) after the tx (creator == owner guarded).
  createdToken?: Address
  createdPool?: Address
  createdTokenId?: bigint

  error?: string
  reset: () => void
}

/** Best-effort human-readable error, dropping the giant viem stack. */
function toMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'shortMessage' in e && typeof (e as { shortMessage: unknown }).shortMessage === 'string') {
    return (e as { shortMessage: string }).shortMessage
  }
  if (e instanceof Error) {
    return e.message.split('\n')[0]
  }
  return 'Transaction failed'
}

/** Parse a non-negative uint string to bigint; undefined when blank/invalid/negative. */
function tryUint(v: string): bigint | undefined {
  const t = v.trim()
  if (t === '') {
    return undefined
  }
  if (!/^\d+$/.test(t)) {
    return undefined
  }
  try {
    return BigInt(t)
  } catch {
    return undefined
  }
}

/** Parse a uint string, treating blank as 0 (for optional fields). undefined = invalid. */
function tryUintOrZero(v: string): bigint | undefined {
  if (v.trim() === '') {
    return 0n
  }
  return tryUint(v)
}

/** Parse a signed int24 string; undefined when blank/invalid/out-of-range. */
function tryInt24(v: string): number | undefined {
  const t = v.trim()
  if (t === '' || !/^-?\d+$/.test(t)) {
    return undefined
  }
  const n = Number(t)
  if (!Number.isInteger(n) || n < INT24_MIN || n > INT24_MAX) {
    return undefined
  }
  return n
}

/** Parse an unsigned integer string within [0, max]; undefined when blank/invalid/out-of-range. */
function tryUintN(v: string, max: number): number | undefined {
  const t = v.trim()
  if (t === '' || !/^\d+$/.test(t)) {
    return undefined
  }
  const n = Number(t)
  if (!Number.isInteger(n) || n < 0 || n > max) {
    return undefined
  }
  return n
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/
const BYTES32_RE = /^0x[0-9a-fA-F]{64}$/

function isAddr(v: string): boolean {
  return ADDRESS_RE.test(v.trim())
}

/** A fresh random bytes32 salt (browser crypto). Falls back to zero if unavailable. */
export function randomSalt(): `0x${string}` {
  const cryptoObj = typeof globalThis !== 'undefined' ? (globalThis.crypto as Crypto | undefined) : undefined
  if (!cryptoObj?.getRandomValues) {
    return ZERO_SALT
  }
  const bytes = new Uint8Array(32)
  cryptoObj.getRandomValues(bytes)
  let hex = '0x'
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, '0')
  }
  return hex as `0x${string}`
}

/**
 * Build (and validate) the typed `cfg` tuple from raw inputs. Returns `{ cfg }` when every
 * field is valid, else `{ error }` with the first blocking problem. `maxBps` gates the
 * creator/team share against the on-chain `MAX_CREATOR_SHARE_BPS` (falls back to 10000).
 */
function buildCfg(input: LaunchConfigInput, maxBps: number): { cfg?: LaunchConfigTuple; error?: string } {
  const name = input.name.trim()
  const symbol = input.symbol.trim()
  if (name === '') {
    return { error: 'Enter a token name' }
  }
  if (symbol === '') {
    return { error: 'Enter a token symbol' }
  }

  const tokenSupply = tryUint(input.tokenSupply)
  if (tokenSupply === undefined || tokenSupply <= 0n) {
    return { error: 'Token supply must be a positive integer (raw uint256)' }
  }

  const salt = input.salt.trim() === '' ? ZERO_SALT : input.salt.trim()
  if (!BYTES32_RE.test(salt)) {
    return { error: 'Salt must be 0x + 64 hex chars (bytes32)' }
  }

  const sqrtPriceX96 = tryUint(input.sqrtPriceX96)
  if (sqrtPriceX96 === undefined || sqrtPriceX96 <= 0n) {
    return { error: 'sqrtPriceX96 must be a positive uint160' }
  }

  const tickLower = tryInt24(input.tickLower)
  if (tickLower === undefined) {
    return { error: 'tickLower must be a whole int24' }
  }
  const tickUpper = tryInt24(input.tickUpper)
  if (tickUpper === undefined) {
    return { error: 'tickUpper must be a whole int24' }
  }
  if (tickUpper <= tickLower) {
    return { error: 'tickUpper must be greater than tickLower' }
  }

  const creatorShareBps = tryUintN(input.creatorShareBps, Math.min(maxBps, 65535))
  if (creatorShareBps === undefined) {
    return { error: `Creator share must be 0–${Math.min(maxBps, 65535)} bps` }
  }

  const teamBps = tryUintN(input.teamBps, 65535)
  if (teamBps === undefined) {
    return { error: 'Team share must be a whole uint16 (bps)' }
  }

  // Team recipient is required only when a team share is set; else it may be the zero address.
  const teamRecipientStr = input.teamRecipient.trim() === '' ? ZERO_ADDRESS : input.teamRecipient.trim()
  if (!isAddr(teamRecipientStr)) {
    return { error: 'Team recipient must be a valid address' }
  }
  if (teamBps > 0 && teamRecipientStr === ZERO_ADDRESS) {
    return { error: 'Set a team recipient when the team share is non-zero' }
  }

  const feeRecipientStr = input.feeRecipient.trim()
  if (!isAddr(feeRecipientStr)) {
    return { error: 'Fee recipient must be a valid address' }
  }

  const dex = tryUintN(input.dex, 255)
  if (dex === undefined) {
    return { error: 'DEX selector must be a whole uint8 (0–255)' }
  }

  const developerBuyWei = tryUintOrZero(input.developerBuyWei)
  if (developerBuyWei === undefined) {
    return { error: 'Dev-buy amount must be a non-negative uint256 (wei)' }
  }
  const developerBuyMinOut = tryUintOrZero(input.developerBuyMinOut)
  if (developerBuyMinOut === undefined) {
    return { error: 'Dev-buy min-out must be a non-negative uint256' }
  }
  const developerBuyDeadline = tryUintOrZero(input.developerBuyDeadline)
  if (developerBuyDeadline === undefined) {
    return { error: 'Dev-buy deadline must be a non-negative uint256 (unix)' }
  }

  return {
    cfg: {
      name,
      symbol,
      metadataUri: input.metadataUri.trim(),
      tokenSupply,
      salt: salt as `0x${string}`,
      sqrtPriceX96,
      tickLower,
      tickUpper,
      creatorShareBps,
      developerBuyWei,
      developerBuyMinOut,
      developerBuyDeadline,
      feeRecipient: feeRecipientStr as Address,
      dex,
      teamBps,
      teamRecipient: teamRecipientStr as Address,
    },
  }
}

export function useLaunch({ chainId, owner, input }: { chainId?: number; owner?: Address; input: LaunchConfigInput }): UseLaunch {
  const launcher = getLaunchpadAddress(chainId)
  const ready = Boolean(launcher)

  /* --------------------------------------------------------------- reads */

  const launchFeeRead = useReadContract({
    address: launcher,
    chainId,
    abi: instantPoolLauncherV2Abi,
    functionName: 'launchFeeWei',
    query: { enabled: ready },
  })
  const launchFeeWei = launchFeeRead.data as bigint | undefined

  const maxShareRead = useReadContract({
    address: launcher,
    chainId,
    abi: instantPoolLauncherV2Abi,
    functionName: 'MAX_CREATOR_SHARE_BPS',
    query: { enabled: ready },
  })
  const maxCreatorShareBps = maxShareRead.data as number | undefined

  const defaultShareRead = useReadContract({
    address: launcher,
    chainId,
    abi: instantPoolLauncherV2Abi,
    functionName: 'DEFAULT_CREATOR_SHARE_BPS',
    query: { enabled: ready },
  })
  const defaultCreatorShareBps = defaultShareRead.data as number | undefined

  const launchCountRead = useReadContract({
    address: launcher,
    chainId,
    abi: instantPoolLauncherV2Abi,
    functionName: 'launchCount',
    query: { enabled: ready },
  })

  /* --------------------------------------------------------------- cfg build + validation */

  const { cfg, error: validationError } = useMemo(
    () => buildCfg(input, maxCreatorShareBps ?? 10000),
    [input, maxCreatorShareBps],
  )

  const totalValue =
    launchFeeWei !== undefined && cfg !== undefined ? launchFeeWei + cfg.developerBuyWei : undefined

  /* --------------------------------------------------------------- write */

  const { writeContractAsync, isPending: isWritePending } = useWriteContract()

  const [launchHash, setLaunchHash] = useState<Hash | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const [latestId, setLatestId] = useState<bigint | undefined>(undefined)

  const launchReceipt = useWaitForTransactionReceipt({ hash: launchHash, chainId })
  const isConfirming = Boolean(launchHash) && launchReceipt.isLoading
  const isDone = Boolean(launchHash) && launchReceipt.isSuccess

  // On confirmation, refetch launchCount → the new launch is the last id (count-1).
  useEffect(() => {
    if (!launchReceipt.isSuccess) {
      return
    }
    void launchCountRead.refetch().then((res) => {
      const count = res.data as bigint | undefined
      if (count !== undefined && count > 0n) {
        setLatestId(count - 1n)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launchReceipt.isSuccess])

  // Read the just-created launch back (token / pool / tokenId), guarded to creator == owner.
  const latestLaunchRead = useReadContract({
    address: launcher,
    chainId,
    abi: instantPoolLauncherV2Abi,
    functionName: 'getLaunch',
    args: latestId !== undefined ? [latestId] : undefined,
    query: { enabled: ready && isDone && latestId !== undefined },
  })
  const latest = latestLaunchRead.data as
    | readonly [Address, Address, Address, string, bigint, bigint]
    | undefined
  const createdMatchesOwner =
    latest !== undefined && owner !== undefined && latest[2].toLowerCase() === owner.toLowerCase()
  const createdToken = createdMatchesOwner ? latest[0] : undefined
  const createdPool = createdMatchesOwner ? latest[1] : undefined
  const createdTokenId = createdMatchesOwner ? latest[4] : undefined

  const inputsValid = Boolean(ready && owner && cfg !== undefined && launchFeeWei !== undefined)
  const canLaunch = inputsValid && !isWritePending && !isConfirming && !isDone

  const launch = async (): Promise<void> => {
    if (!canLaunch || !launcher || cfg === undefined || launchFeeWei === undefined) {
      return
    }
    setError(undefined)
    try {
      const hash = await writeContractAsync({
        address: launcher,
        chainId,
        abi: instantPoolLauncherV2Abi,
        functionName: 'launch',
        // viem's arg inference bottoms out to `never` for this call: the 16-field `cfg` tuple on a
        // large ABI exceeds its generic-inference depth. `LaunchConfigTuple` is verified field-for-field
        // against the ABI's tuple components (string/bigint/number/0x-hex all line up), and viem encodes
        // from the ABI at runtime regardless of this static hint — so the cast is safe, not a shape fudge.
        args: [cfg] as never,
        // launchFeeWei + developerBuyWei — exactly what the contract requires as msg.value.
        value: launchFeeWei + cfg.developerBuyWei,
      })
      setLaunchHash(hash)
    } catch (e) {
      setError(toMessage(e))
    }
  }

  const reset = (): void => {
    setLaunchHash(undefined)
    setError(undefined)
    setLatestId(undefined)
  }

  return useMemo(
    () => ({
      ready,
      launcher,
      launchFeeWei,
      totalValue,
      defaultCreatorShareBps,
      maxCreatorShareBps,
      cfg,
      validationError,
      inputsValid,
      canLaunch,
      launch,
      isWritePending,
      launchHash,
      isConfirming,
      isDone,
      createdToken,
      createdPool,
      createdTokenId,
      error,
      reset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      ready,
      launcher,
      launchFeeWei,
      totalValue,
      defaultCreatorShareBps,
      maxCreatorShareBps,
      cfg,
      validationError,
      inputsValid,
      canLaunch,
      isWritePending,
      launchHash,
      isConfirming,
      isDone,
      createdToken,
      createdPool,
      createdTokenId,
      error,
    ],
  )
}

/* ------------------------------------------------------------------ my launches */

export interface MyLaunch {
  id: bigint
  token: Address
  pool: Address
  creator: Address
  metadataUri: string
  tokenId: bigint
  createdAt: bigint
  /** Creator ETH pending for this token's position (raw wei), or undefined while loading. */
  pendingEth?: bigint
}

export interface UseMyLaunches {
  ready: boolean
  launcher?: Address
  isLoading: boolean
  /** Launches created by `owner`, newest first (scanned over the last {@link MY_LAUNCHES_SCAN} ids). */
  launches: MyLaunch[]
  /** Sum of per-launch `pendingEth` (raw wei). */
  totalPending: bigint

  // Fee claim.
  collect: (token: Address) => Promise<void>
  withdrawPending: () => Promise<void>
  claimingToken?: Address
  isClaiming: boolean
  claimError?: string
  refetch: () => void
}

export function useMyLaunches({ chainId, owner }: { chainId?: number; owner?: Address }): UseMyLaunches {
  const launcher = getLaunchpadAddress(chainId)
  const ready = Boolean(launcher)

  const countRead = useReadContract({
    address: launcher,
    chainId,
    abi: instantPoolLauncherV2Abi,
    functionName: 'launchCount',
    query: { enabled: ready && Boolean(owner) },
  })
  const count = countRead.data as bigint | undefined

  // Ids to scan: the most recent MY_LAUNCHES_SCAN ids (descending).
  const ids = useMemo(() => {
    if (count === undefined || count <= 0n) {
      return [] as bigint[]
    }
    const out: bigint[] = []
    const start = count - 1n
    const end = start - BigInt(MY_LAUNCHES_SCAN) + 1n
    for (let i = start; i >= 0n && i >= end; i--) {
      out.push(i)
    }
    return out
  }, [count])

  const launchesRead = useReadContracts({
    contracts: ids.map((id) => ({
      address: launcher,
      chainId,
      abi: instantPoolLauncherV2Abi,
      functionName: 'getLaunch' as const,
      args: [id] as const,
    })),
    query: { enabled: ready && Boolean(owner) && ids.length > 0 },
  })

  // Keep only launches whose creator == owner, preserving the newest-first id order.
  const mine = useMemo(() => {
    if (!owner || !launchesRead.data) {
      return [] as MyLaunch[]
    }
    const ownerLc = owner.toLowerCase()
    const out: MyLaunch[] = []
    launchesRead.data.forEach((entry, i) => {
      if (entry.status !== 'success' || !entry.result) {
        return
      }
      const r = entry.result as readonly [Address, Address, Address, string, bigint, bigint]
      if (r[2].toLowerCase() !== ownerLc) {
        return
      }
      out.push({
        id: ids[i],
        token: r[0],
        pool: r[1],
        creator: r[2],
        metadataUri: r[3],
        tokenId: r[4],
        createdAt: r[5],
      })
    })
    return out
  }, [owner, launchesRead.data, ids])

  // pendingEth(token) per owned launch.
  const pendingRead = useReadContracts({
    contracts: mine.map((m) => ({
      address: launcher,
      chainId,
      abi: instantPoolLauncherV2Abi,
      functionName: 'pendingEth' as const,
      args: [m.token] as const,
    })),
    query: { enabled: ready && mine.length > 0 },
  })

  const launches = useMemo(() => {
    return mine.map((m, i) => {
      const entry = pendingRead.data?.[i]
      const pending = entry?.status === 'success' ? (entry.result as bigint) : undefined
      return { ...m, pendingEth: pending }
    })
  }, [mine, pendingRead.data])

  const totalPending = useMemo(
    () => launches.reduce((sum, l) => sum + (l.pendingEth ?? 0n), 0n),
    [launches],
  )

  /* --------------------------------------------------------------- claim writes */

  const { writeContractAsync, isPending } = useWriteContract()
  const [claimingToken, setClaimingToken] = useState<Address | undefined>(undefined)
  const [claimError, setClaimError] = useState<string | undefined>(undefined)

  const collect = async (token: Address): Promise<void> => {
    if (!launcher) {
      return
    }
    setClaimError(undefined)
    setClaimingToken(token)
    try {
      await writeContractAsync({
        address: launcher,
        chainId,
        abi: instantPoolLauncherV2Abi,
        functionName: 'collect',
        args: [token],
      })
    } catch (e) {
      setClaimError(toMessage(e))
    } finally {
      setClaimingToken(undefined)
    }
  }

  const withdrawPending = async (): Promise<void> => {
    if (!launcher) {
      return
    }
    setClaimError(undefined)
    try {
      await writeContractAsync({
        address: launcher,
        chainId,
        abi: instantPoolLauncherV2Abi,
        functionName: 'withdrawPending',
        args: [],
      })
    } catch (e) {
      setClaimError(toMessage(e))
    }
  }

  const refetch = (): void => {
    void countRead.refetch()
    void launchesRead.refetch()
    void pendingRead.refetch()
  }

  const isLoading = Boolean(owner) && (countRead.isLoading || launchesRead.isLoading)

  return useMemo(
    () => ({
      ready,
      launcher,
      isLoading,
      launches,
      totalPending,
      collect,
      withdrawPending,
      claimingToken,
      isClaiming: isPending,
      claimError,
      refetch,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, launcher, isLoading, launches, totalPending, claimingToken, isPending, claimError],
  )
}
