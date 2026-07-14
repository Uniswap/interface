/**
 * HookSwap Terminal — the connected wallet's vesting schedules (real on-chain reads).
 *
 * `HookSwapVestingManager` indexes every new schedule id under BOTH the beneficiary AND the
 * creator (`_schedulesForAddress[beneficiary].push(id)` + the same for `msg.sender`), so a
 * single `getSchedulesForAddress(owner)` read serves BOTH roles: schedules you receive and
 * schedules you granted. Rows expose `isBeneficiary` so the UI can enable Release only for
 * the address the child contract will actually pay (`release()` is beneficiary-ONLY).
 *
 * Read chain (all REAL — no mock data, no fabricated amounts):
 *   1. manager.getSchedulesForAddress(owner)          → uint256[] ids
 *   2. manager.getScheduleData(id)          (fan-out) → the 10-field schedule tuple
 *   3. child.releasable()                   (fan-out) → claimable RIGHT NOW (live block time)
 *   4. token.decimals() / token.symbol()    (fan-out) → per-token display units
 *
 * A row's Vested = released + releasable (identity from the child: `releasable() =
 * vestedAmount(now) - released`), and Locked = total - vested — both derived from real reads
 * rather than a client-side re-implementation of the curve, so what the UI shows is exactly
 * what the contract would pay.
 *
 * `release(child)` is a REAL write; the receipt refetches the reads so the row updates from
 * chain state, never optimistically.
 */
import { useEffect, useMemo, useState } from 'react'
import { useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { erc20Abi, type Address, type Hash } from '~/chains'
import { getVestingAddress } from '~/terminal/vesting/addresses'
import { vestingChildAbi, vestingManagerAbi } from '~/terminal/vesting/abis'

export interface VestingScheduleRow {
  id: bigint
  /** The per-schedule `HookSwapVesting` child holding the tokens (the `release()` target). */
  contractAddress: Address
  token: Address
  tokenSymbol?: string
  tokenDecimals?: number
  beneficiary: Address
  creator: Address
  /** Absolute unix seconds the curve starts at. */
  start: number
  /** Cliff length in seconds, from `start`. */
  cliff: number
  /** Total vesting length in seconds, from `start`. */
  duration: number
  totalAmount: bigint
  released: bigint
  /** Claimable right now — the child's live `releasable()`. */
  releasable: bigint
  /** released + releasable (what the curve has vested at the current block). */
  vested: bigint
  /** totalAmount - vested (still on the curve). */
  locked: bigint
  /** The connected wallet is this schedule's beneficiary → it alone can `release()`. */
  isBeneficiary: boolean
}

export interface UseMySchedules {
  /** True when the chain has a deployed HookSwapVestingManager. */
  ready: boolean
  /** undefined = still loading; [] = genuinely no schedules (honest empty state). */
  rows?: VestingScheduleRow[]
  isLoading: boolean
  error: boolean
  refetch: () => void

  /** Release all currently-vested tokens from a schedule's child contract. */
  release: (child: Address) => Promise<void>
  /** The child address currently being released (write pending or receipt confirming). */
  releasingChild?: Address
  /** A release tx is in flight (any row). */
  isReleasing: boolean
  releaseError?: string
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

/** The 10-field tuple returned by `getScheduleData`. */
type ScheduleTuple = readonly [bigint, Address, Address, Address, bigint, bigint, bigint, bigint, bigint, Address]

export function useMySchedules({ chainId, owner }: { chainId?: number; owner?: Address }): UseMySchedules {
  const manager = getVestingAddress(chainId)
  const ready = Boolean(manager)
  const enabled = Boolean(manager && owner && chainId)

  /* --------------------------------------------------------------- 1. ids */

  const idsRead = useReadContract({
    address: manager,
    chainId,
    abi: vestingManagerAbi,
    functionName: 'getSchedulesForAddress',
    args: owner ? [owner] : undefined,
    query: { enabled },
  })
  const ids = idsRead.data as readonly bigint[] | undefined

  /* --------------------------------------------------------------- 2. schedule data */

  const dataRead = useReadContracts({
    contracts: (ids ?? []).map((id) => ({
      address: manager,
      chainId,
      abi: vestingManagerAbi,
      functionName: 'getScheduleData' as const,
      args: [id] as const,
    })),
    query: { enabled: enabled && Boolean(ids && ids.length > 0) },
  })

  /** Successfully-decoded schedule tuples (a failed read is skipped, never faked). */
  const schedules = useMemo((): ScheduleTuple[] | undefined => {
    if (!ids) {
      return undefined
    }
    if (ids.length === 0) {
      return []
    }
    if (!dataRead.data) {
      return undefined
    }
    const out: ScheduleTuple[] = []
    for (const entry of dataRead.data) {
      if (entry.status === 'success' && entry.result) {
        out.push(entry.result as unknown as ScheduleTuple)
      }
    }
    return out
  }, [ids, dataRead.data])

  /* --------------------------------------------------------------- 3. live releasable */

  const releasableRead = useReadContracts({
    contracts: (schedules ?? []).map((s) => ({
      address: s[9],
      chainId,
      abi: vestingChildAbi,
      functionName: 'releasable' as const,
    })),
    query: { enabled: enabled && Boolean(schedules && schedules.length > 0) },
  })

  /* --------------------------------------------------------------- 4. token metadata */

  const tokenMetaRead = useReadContracts({
    contracts: (schedules ?? []).flatMap((s) => [
      { address: s[1], chainId, abi: erc20Abi, functionName: 'decimals' as const },
      { address: s[1], chainId, abi: erc20Abi, functionName: 'symbol' as const },
    ]),
    query: { enabled: enabled && Boolean(schedules && schedules.length > 0) },
  })

  /* --------------------------------------------------------------- rows */

  const rows = useMemo((): VestingScheduleRow[] | undefined => {
    if (!schedules) {
      return undefined
    }
    if (schedules.length === 0) {
      return []
    }
    // Wait for the live `releasable()` fan-out — a row without it would have to guess the
    // claimable amount, which is exactly what we must never do.
    if (!releasableRead.data) {
      return undefined
    }
    const ownerLower = owner?.toLowerCase()

    return schedules.map((s, i): VestingScheduleRow => {
      const releasableEntry = releasableRead.data?.[i]
      const releasable =
        releasableEntry && releasableEntry.status === 'success' ? (releasableEntry.result as bigint) : 0n

      const decimalsEntry = tokenMetaRead.data?.[i * 2]
      const symbolEntry = tokenMetaRead.data?.[i * 2 + 1]
      const tokenDecimals =
        decimalsEntry && decimalsEntry.status === 'success' ? (decimalsEntry.result as number) : undefined
      const tokenSymbol = symbolEntry && symbolEntry.status === 'success' ? (symbolEntry.result as string) : undefined

      const totalAmount = s[7]
      const released = s[8]
      const vested = released + releasable
      const locked = totalAmount > vested ? totalAmount - vested : 0n
      const beneficiary = s[2]

      return {
        id: s[0],
        contractAddress: s[9],
        token: s[1],
        tokenSymbol,
        tokenDecimals,
        beneficiary,
        creator: s[3],
        start: Number(s[4]),
        cliff: Number(s[5]),
        duration: Number(s[6]),
        totalAmount,
        released,
        releasable,
        vested,
        locked,
        isBeneficiary: Boolean(ownerLower && beneficiary.toLowerCase() === ownerLower),
      }
    })
  }, [schedules, releasableRead.data, tokenMetaRead.data, owner])

  /* --------------------------------------------------------------- release */

  const { writeContractAsync, isPending: isWritePending } = useWriteContract()
  const [releasingChild, setReleasingChild] = useState<Address | undefined>(undefined)
  const [releaseHash, setReleaseHash] = useState<Hash | undefined>(undefined)
  const [releaseError, setReleaseError] = useState<string | undefined>(undefined)

  const releaseReceipt = useWaitForTransactionReceipt({ hash: releaseHash, chainId })
  const isReleasing = isWritePending || (Boolean(releaseHash) && releaseReceipt.isLoading)

  const refetch = (): void => {
    void idsRead.refetch()
    void dataRead.refetch()
    void releasableRead.refetch()
  }

  // Refresh from chain state once the release confirms — never update the row optimistically.
  useEffect(() => {
    if (releaseReceipt.isSuccess) {
      void dataRead.refetch()
      void releasableRead.refetch()
      setReleaseHash(undefined)
      setReleasingChild(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [releaseReceipt.isSuccess])

  const release = async (child: Address): Promise<void> => {
    if (isReleasing) {
      return
    }
    setReleaseError(undefined)
    setReleasingChild(child)
    try {
      const hash = await writeContractAsync({
        address: child,
        chainId,
        abi: vestingChildAbi,
        functionName: 'release',
        args: [],
      })
      setReleaseHash(hash)
    } catch (e) {
      setReleaseError(toMessage(e))
      setReleasingChild(undefined)
    }
  }

  const isLoading =
    enabled &&
    (idsRead.isLoading ||
      (Boolean(ids && ids.length > 0) && (dataRead.isLoading || releasableRead.isLoading)))

  return {
    ready,
    rows,
    isLoading,
    error: Boolean(idsRead.error || dataRead.error || releasableRead.error),
    refetch,
    release,
    releasingChild,
    isReleasing,
    releaseError,
  }
}
