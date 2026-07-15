/**
 * HookSwap Terminal — client-side one-shot pool launch (HookOSV3Launcher).
 *
 * Self-contained CLIENT-SIDE flow (NO backend, NO Permit2, NO approval): a single
 * payable `launch(p)` deploys a fresh token, opens its v3 pool, and (optionally)
 * performs the creator's initial buy — all in one tx. LP position is registered in
 * the HookOSV3FeeVault (principal locked forever, fees split per-dex).
 *
 * `msg.value` = `quoteLaunchCost(lockOnHookSwap, initialBuyEth)` — the contract
 * computes the total cost (base fee + lock fee + initial buy) on-chain.
 *
 * Fee collection lives on the FeeVault contract: `pending(token)` to preview,
 * `collect(token)` to claim, `withdrawPending()` for deferred ETH.
 */
import { useEffect, useMemo, useState } from 'react'
import { useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { type Address, type Hash } from '~/chains'
import { hookOSV3LauncherAbi, hookOSV3FeeVaultAbi } from '~/terminal/launchpad/abis'
import { getLaunchpadAddress, getFeeVaultAddress } from '~/terminal/launchpad/addresses'

/** Zero bytes32 — the default salt when the user doesn't randomize one. */
export const ZERO_SALT = `0x${'0'.repeat(64)}` as const
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
/** How many recent launches `useMyLaunches` scans back over (block-read budget). */
export const MY_LAUNCHES_SCAN = 50
const INT24_MIN = -8_388_608
const INT24_MAX = 8_388_607

/** V3Dex enum values matching the contract. */
export const V3Dex = { UniswapV3: 0, HookSwap: 1 } as const
/** PairToken enum values matching the contract. */
export const PairToken = { WETH: 0, HOOK: 1 } as const

/** The raw `launch(p)` inputs, exactly as the form collects them (strings). */
export interface LaunchConfigInput {
  name: string
  symbol: string
  metadataURI: string
  totalSupply: string
  salt: string
  sqrtPriceX96: string
  tickLower: string
  tickUpper: string
  /** Raw uint256 wei for initial buy (default 0). */
  initialBuyEth: string
  initialBuyMinOut: string
  initialBuyDeadline: string
  /** V3Dex: 0 = UniswapV3, 1 = HookSwap. */
  dex: string
  /** PairToken: 0 = WETH, 1 = HOOK. */
  pair: string
  /** Whether to lock LP on HookSwap's locker. */
  lockOnHookSwap: boolean
}

/** The typed `p` tuple passed to `launch` (viem-encodable). */
export interface LaunchParamsTuple {
  name: string
  symbol: string
  metadataURI: string
  totalSupply: bigint
  salt: `0x${string}`
  sqrtPriceX96: bigint
  tickLower: number
  tickUpper: number
  initialBuyEth: bigint
  initialBuyMinOut: bigint
  initialBuyDeadline: bigint
  dex: number
  pair: number
  lockOnHookSwap: boolean
}

export interface UseLaunch {
  ready: boolean
  launcher?: Address
  feeVault?: Address
  /** Base launch fee in wei (from effectiveLaunchFee), or undefined while loading. */
  baseFeeWei?: bigint
  /** Launch fee in USD (e.g. 8e18 = $8), or undefined while loading. */
  launchFeeUsd?: bigint
  /** Total msg.value from quoteLaunchCost, or undefined while loading. */
  totalValue?: bigint
  /** Whether HOOK pair is available on-chain. */
  hookPairEnabled?: boolean
  cfg?: LaunchParamsTuple
  validationError?: string

  inputsValid: boolean
  canLaunch: boolean
  launch: () => Promise<void>
  isWritePending: boolean
  launchHash?: Hash
  isConfirming: boolean
  isDone: boolean

  createdToken?: Address
  createdPool?: Address
  createdTokenId?: bigint

  error?: string
  reset: () => void
}

function toMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'shortMessage' in e && typeof (e as { shortMessage: unknown }).shortMessage === 'string') {
    return (e as { shortMessage: string }).shortMessage
  }
  if (e instanceof Error) {
    return e.message.split('\n')[0]
  }
  return 'Transaction failed'
}

function tryUint(v: string): bigint | undefined {
  const t = v.trim()
  if (t === '' || !/^\d+$/.test(t)) {
    return undefined
  }
  try {
    return BigInt(t)
  } catch {
    return undefined
  }
}

function tryUintOrZero(v: string): bigint | undefined {
  if (v.trim() === '') {
    return 0n
  }
  return tryUint(v)
}

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

const BYTES32_RE = /^0x[0-9a-fA-F]{64}$/

/** A fresh random bytes32 salt (browser crypto). */
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
 * Build and validate the typed `p` tuple from raw inputs.
 */
function buildParams(input: LaunchConfigInput): { cfg?: LaunchParamsTuple; error?: string } {
  const name = input.name.trim()
  const symbol = input.symbol.trim()
  if (name === '') {
    return { error: 'Enter a token name' }
  }
  if (symbol === '') {
    return { error: 'Enter a token symbol' }
  }

  const totalSupply = tryUint(input.totalSupply)
  if (totalSupply === undefined || totalSupply <= 0n) {
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

  const dex = tryUintN(input.dex, 1)
  if (dex === undefined) {
    return { error: 'DEX must be 0 (Uniswap V3) or 1 (HookSwap)' }
  }

  const pair = tryUintN(input.pair, 1)
  if (pair === undefined) {
    return { error: 'Pair must be 0 (WETH) or 1 (HOOK)' }
  }

  const initialBuyEth = tryUintOrZero(input.initialBuyEth)
  if (initialBuyEth === undefined) {
    return { error: 'Initial buy amount must be a non-negative uint256 (wei)' }
  }
  const initialBuyMinOut = tryUintOrZero(input.initialBuyMinOut)
  if (initialBuyMinOut === undefined) {
    return { error: 'Initial buy min-out must be a non-negative uint256' }
  }
  const initialBuyDeadline = tryUintOrZero(input.initialBuyDeadline)
  if (initialBuyDeadline === undefined) {
    return { error: 'Initial buy deadline must be a non-negative uint256 (unix)' }
  }

  return {
    cfg: {
      name,
      symbol,
      metadataURI: input.metadataURI.trim(),
      totalSupply,
      salt: salt as `0x${string}`,
      sqrtPriceX96,
      tickLower,
      tickUpper,
      initialBuyEth,
      initialBuyMinOut,
      initialBuyDeadline,
      dex,
      pair,
      lockOnHookSwap: input.lockOnHookSwap,
    },
  }
}

export function useLaunch({ chainId, owner, input }: { chainId?: number; owner?: Address; input: LaunchConfigInput }): UseLaunch {
  const launcher = getLaunchpadAddress(chainId)
  const feeVault = getFeeVaultAddress(chainId)
  const ready = Boolean(launcher)

  /* --------------------------------------------------------------- reads */

  const baseFeeRead = useReadContract({
    address: launcher,
    chainId,
    abi: hookOSV3LauncherAbi,
    functionName: 'effectiveLaunchFee',
    query: { enabled: ready },
  })
  const baseFeeWei = baseFeeRead.data as bigint | undefined

  const feeUsdRead = useReadContract({
    address: launcher,
    chainId,
    abi: hookOSV3LauncherAbi,
    functionName: 'launchFeeUsd',
    query: { enabled: ready },
  })
  const launchFeeUsd = feeUsdRead.data as bigint | undefined

  const hookPairRead = useReadContract({
    address: launcher,
    chainId,
    abi: hookOSV3LauncherAbi,
    functionName: 'hookPairEnabled',
    query: { enabled: ready },
  })
  const hookPairEnabled = hookPairRead.data as boolean | undefined

  const launchCountRead = useReadContract({
    address: launcher,
    chainId,
    abi: hookOSV3LauncherAbi,
    functionName: 'launchCount',
    query: { enabled: ready },
  })

  /* --------------------------------------------------------------- cfg build + validation */

  const { cfg, error: validationError } = useMemo(() => buildParams(input), [input])

  // quoteLaunchCost(lockOnHookSwap, initialBuyEth) — total msg.value.
  const quoteCostRead = useReadContract({
    address: launcher,
    chainId,
    abi: hookOSV3LauncherAbi,
    functionName: 'quoteLaunchCost',
    args: cfg ? [cfg.lockOnHookSwap, cfg.initialBuyEth] : undefined,
    query: { enabled: ready && cfg !== undefined },
  })
  const totalValue = quoteCostRead.data as bigint | undefined

  /* --------------------------------------------------------------- write */

  const { writeContractAsync, isPending: isWritePending } = useWriteContract()

  const [launchHash, setLaunchHash] = useState<Hash | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const [latestId, setLatestId] = useState<bigint | undefined>(undefined)

  const launchReceipt = useWaitForTransactionReceipt({ hash: launchHash, chainId })
  const isConfirming = Boolean(launchHash) && launchReceipt.isLoading
  const isDone = Boolean(launchHash) && launchReceipt.isSuccess

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

  // Read the just-created launch back, guarded to creator == owner.
  const latestLaunchRead = useReadContract({
    address: launcher,
    chainId,
    abi: hookOSV3LauncherAbi,
    functionName: 'getLaunch',
    args: latestId !== undefined ? [latestId] : undefined,
    query: { enabled: ready && isDone && latestId !== undefined },
  })
  // getLaunch returns a tuple struct
  const latest = latestLaunchRead.data as
    | { token: Address; pool: Address; creator: Address; tokenId: bigint; feeTier: number; dex: number; locker: Address; pair: number; pairToken: Address; metadataURI: string; createdAt: bigint }
    | undefined
  const createdMatchesOwner =
    latest !== undefined && owner !== undefined && latest.creator.toLowerCase() === owner.toLowerCase()
  const createdToken = createdMatchesOwner ? latest.token : undefined
  const createdPool = createdMatchesOwner ? latest.pool : undefined
  const createdTokenId = createdMatchesOwner ? latest.tokenId : undefined

  const inputsValid = Boolean(ready && owner && cfg !== undefined && totalValue !== undefined)
  const canLaunch = inputsValid && !isWritePending && !isConfirming && !isDone

  const launch = async (): Promise<void> => {
    if (!canLaunch || !launcher || cfg === undefined || totalValue === undefined) {
      return
    }
    setError(undefined)
    try {
      const hash = await writeContractAsync({
        address: launcher,
        chainId,
        abi: hookOSV3LauncherAbi,
        functionName: 'launch',
        args: [cfg] as never,
        value: totalValue,
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
      feeVault,
      baseFeeWei,
      launchFeeUsd,
      totalValue,
      hookPairEnabled,
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
      ready, launcher, feeVault, baseFeeWei, launchFeeUsd, totalValue, hookPairEnabled,
      cfg, validationError, inputsValid, canLaunch,
      isWritePending, launchHash, isConfirming, isDone,
      createdToken, createdPool, createdTokenId, error,
    ],
  )
}

/* ------------------------------------------------------------------ my launches */

export interface MyLaunch {
  id: bigint
  token: Address
  pool: Address
  creator: Address
  metadataURI: string
  tokenId: bigint
  dex: number
  createdAt: bigint
  /** Pending WETH fees for this position (from vault), raw wei. */
  pendingWeth?: bigint
  /** Pending token fees for this position (from vault). */
  pendingToken?: bigint
}

export interface UseMyLaunches {
  ready: boolean
  launcher?: Address
  feeVault?: Address
  isLoading: boolean
  launches: MyLaunch[]
  /** Sum of per-launch pendingWeth (raw wei). */
  totalPendingWeth: bigint
  /** Deferred ETH on the vault for this account. */
  deferredEth: bigint

  collect: (token: Address) => Promise<void>
  withdrawPending: () => Promise<void>
  claimingToken?: Address
  isClaiming: boolean
  claimError?: string
  refetch: () => void
}

export function useMyLaunches({ chainId, owner }: { chainId?: number; owner?: Address }): UseMyLaunches {
  const launcher = getLaunchpadAddress(chainId)
  const feeVault = getFeeVaultAddress(chainId)
  const ready = Boolean(launcher) && Boolean(feeVault)

  const countRead = useReadContract({
    address: launcher,
    chainId,
    abi: hookOSV3LauncherAbi,
    functionName: 'launchCount',
    query: { enabled: ready && Boolean(owner) },
  })
  const count = countRead.data as bigint | undefined

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
      abi: hookOSV3LauncherAbi,
      functionName: 'getLaunch' as const,
      args: [id] as const,
    })),
    query: { enabled: ready && Boolean(owner) && ids.length > 0 },
  })

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
      const r = entry.result as { token: Address; pool: Address; creator: Address; tokenId: bigint; feeTier: number; dex: number; locker: Address; pair: number; pairToken: Address; metadataURI: string; createdAt: bigint }
      if (r.creator.toLowerCase() !== ownerLc) {
        return
      }
      out.push({
        id: ids[i],
        token: r.token,
        pool: r.pool,
        creator: r.creator,
        metadataURI: r.metadataURI,
        tokenId: r.tokenId,
        dex: r.dex,
        createdAt: r.createdAt,
      })
    })
    return out
  }, [owner, launchesRead.data, ids])

  // Read pending fees from the FeeVault (not the launcher).
  const pendingRead = useReadContracts({
    contracts: mine.map((m) => ({
      address: feeVault,
      chainId,
      abi: hookOSV3FeeVaultAbi,
      functionName: 'pending' as const,
      args: [m.token] as const,
    })),
    query: { enabled: ready && mine.length > 0 },
  })

  // Deferred ETH for the connected account on the vault.
  const deferredRead = useReadContract({
    address: feeVault,
    chainId,
    abi: hookOSV3FeeVaultAbi,
    functionName: 'pendingEth',
    args: owner ? [owner] : undefined,
    query: { enabled: ready && Boolean(owner) },
  })
  const deferredEth = (deferredRead.data as bigint) ?? 0n

  const launches = useMemo(() => {
    return mine.map((m, i) => {
      const entry = pendingRead.data?.[i]
      if (entry?.status === 'success' && entry.result) {
        const [wethOwed, tokenOwed] = entry.result as [bigint, bigint]
        return { ...m, pendingWeth: wethOwed, pendingToken: tokenOwed }
      }
      return m
    })
  }, [mine, pendingRead.data])

  const totalPendingWeth = useMemo(
    () => launches.reduce((sum, l) => sum + (l.pendingWeth ?? 0n), 0n),
    [launches],
  )

  /* --------------------------------------------------------------- claim writes (on vault) */

  const { writeContractAsync, isPending } = useWriteContract()
  const [claimingToken, setClaimingToken] = useState<Address | undefined>(undefined)
  const [claimError, setClaimError] = useState<string | undefined>(undefined)

  const collect = async (token: Address): Promise<void> => {
    if (!feeVault) {
      return
    }
    setClaimError(undefined)
    setClaimingToken(token)
    try {
      await writeContractAsync({
        address: feeVault,
        chainId,
        abi: hookOSV3FeeVaultAbi,
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
    if (!feeVault) {
      return
    }
    setClaimError(undefined)
    try {
      await writeContractAsync({
        address: feeVault,
        chainId,
        abi: hookOSV3FeeVaultAbi,
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
    void deferredRead.refetch()
  }

  const isLoading = Boolean(owner) && (countRead.isLoading || launchesRead.isLoading)

  return useMemo(
    () => ({
      ready,
      launcher,
      feeVault,
      isLoading,
      launches,
      totalPendingWeth,
      deferredEth,
      collect,
      withdrawPending,
      claimingToken,
      isClaiming: isPending,
      claimError,
      refetch,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, launcher, feeVault, isLoading, launches, totalPendingWeth, deferredEth, claimingToken, isPending, claimError],
  )
}
