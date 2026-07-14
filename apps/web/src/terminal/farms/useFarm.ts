/**
 * HookSwap Terminal — per-farm reads + stake/claim/unstake writes (StakingRewards).
 *
 * Two hooks, both REAL wagmi reads/writes — no mock data, no fabricated amounts:
 *
 *   • `useFarmList(chainId)` — the factory's `allFarms()` registry (a single call returning the
 *     full address[]), so the Manage tab can offer a pick-list of deployed farms in ADDITION to
 *     pasting an address. (`allFarms()` is lighter than looping `farmsLength()`+`farmAt(i)`.)
 *
 *   • `useFarm({ chainId, owner, farm, stakeAmount, unstakeAmount })` — everything the Manage tab
 *     renders for one farm:
 *       - core reads (wallet-independent): `stakingToken` / `rewardsToken` / `totalSupply` /
 *         `rewardRate` / `periodFinish`.
 *       - user reads (need a connected wallet): `earned(owner)` / `balanceOf(owner)`.
 *       - token metadata: staking + reward `decimals` / `symbol` (resolved off the two token
 *         addresses the farm reports).
 *       - the stake allowance gate: `stake()` pulls the staking token via `transferFrom`, so
 *         staking is gated behind `approve(farm, amount)` on the STAKING token; claim + withdraw
 *         need no approval.
 *       - writes: `approve` / `stake` / `getReward` (claim) / `withdraw`, one in flight at a time.
 *
 * APR HONESTY: this hook exposes `rewardRate` (reward-token/second) and raw staked balances
 * ONLY. It deliberately computes NO APR — an APR needs a USD price for both the staking and the
 * reward token, which isn't available on Robinhood until a USD-anchor pool exists. The screen
 * shows reward rate + staked amounts in token terms and an honest "APR needs a USD anchor" note
 * rather than fabricating a yield figure.
 *
 * See `contracts/farms/src/StakingRewards.sol` + `~/terminal/farms/abis.ts`.
 */
import { useEffect, useMemo, useState } from 'react'
import { useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { erc20Abi, isAddress, parseUnits, type Address, type Hash } from '~/chains'
import { stakingRewardsAbi, stakingRewardsFactoryAbi } from '~/terminal/farms/abis'
import { getFarmFactory } from '~/terminal/farms/addresses'
import { assume0xAddress } from '~/utils/wagmi'

/* ================================================================= farm list (discovery) */

export interface UseFarmList {
  /** True when the chain has a deployed StakingRewardsFactory. */
  ready: boolean
  /** undefined = still loading; [] = genuinely no farms yet (honest empty state). */
  farms?: Address[]
  isLoading: boolean
  error: boolean
  refetch: () => void
}

export function useFarmList({ chainId }: { chainId?: number }): UseFarmList {
  const factory = getFarmFactory(chainId)
  const ready = Boolean(factory)

  const read = useReadContract({
    address: factory,
    chainId,
    abi: stakingRewardsFactoryAbi,
    functionName: 'allFarms',
    query: { enabled: Boolean(factory && chainId) },
  })

  const farms = read.data as readonly Address[] | undefined

  return {
    ready,
    farms: farms ? [...farms] : undefined,
    isLoading: ready && read.isLoading,
    error: Boolean(read.error),
    refetch: () => void read.refetch(),
  }
}

/* ================================================================= single farm */

/** The write action currently in flight (only one at a time). */
export type FarmAction = 'approve' | 'stake' | 'withdraw' | 'claim'

export interface UseFarm {
  /** True when `farm` is a well-formed address. */
  validFarm: boolean
  /** Checksummed farm address, or undefined when the input isn't a valid address. */
  farmAddress?: Address

  // Token identities + metadata (real reads off the farm).
  stakingToken?: Address
  rewardsToken?: Address
  stakingSymbol?: string
  stakingDecimals?: number
  rewardSymbol?: string
  rewardDecimals?: number

  // Live amounts (raw base units; "—" in the UI until resolved).
  /** Connected wallet's staked balance. */
  staked?: bigint
  /** Total staked across all users. */
  totalStaked?: bigint
  /** Connected wallet's claimable rewards right now. */
  earned?: bigint
  /** Reward tokens streamed per SECOND over the active period. */
  rewardRate?: bigint
  /** Unix timestamp the current reward period ends (0 before first funding). */
  periodFinish?: bigint

  isLoadingCore: boolean
  error: boolean
  refetch: () => void

  // Parsed action amounts + validity.
  stakeRaw?: bigint
  unstakeRaw?: bigint
  validStake: boolean
  /** Unstake amount is > 0 AND <= the wallet's staked balance. */
  validUnstake: boolean

  // Stake allowance gate (staking token → farm).
  needsApproval: boolean
  allowanceKnown: boolean

  // Actions (one write in flight at a time).
  canApprove: boolean
  canStake: boolean
  canClaim: boolean
  canWithdraw: boolean
  approve: () => Promise<void>
  stake: () => Promise<void>
  claim: () => Promise<void>
  withdraw: () => Promise<void>
  /** The action whose tx is pending (wallet-confirm or receipt), or undefined when idle. */
  pendingAction?: FarmAction
  actionError?: string
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

/** parseUnits that returns undefined for an empty/zero/invalid amount (never throws). */
function tryParse(amount: string, decimals?: number): bigint | undefined {
  if (!amount || decimals === undefined) {
    return undefined
  }
  const n = Number(amount)
  if (!Number.isFinite(n) || n <= 0) {
    return undefined
  }
  try {
    const raw = parseUnits(amount, decimals)
    return raw > 0n ? raw : undefined
  } catch {
    return undefined
  }
}

export function useFarm({
  chainId,
  owner,
  farm,
  stakeAmount,
  unstakeAmount,
}: {
  chainId?: number
  owner?: Address
  /** Pasted / selected farm (StakingRewards) address. */
  farm: string
  /** Human amount to stake (whole tokens); scaled by the staking token's decimals. */
  stakeAmount: string
  /** Human amount to unstake (whole tokens); scaled by the staking token's decimals. */
  unstakeAmount: string
}): UseFarm {
  const validFarm = isAddress(farm)
  const farmAddress = assume0xAddress(validFarm ? farm : undefined)

  /* --------------------------------------------------------------- core reads (no wallet) */

  const coreRead = useReadContracts({
    contracts: [
      { address: farmAddress, chainId, abi: stakingRewardsAbi, functionName: 'stakingToken' as const },
      { address: farmAddress, chainId, abi: stakingRewardsAbi, functionName: 'rewardsToken' as const },
      { address: farmAddress, chainId, abi: stakingRewardsAbi, functionName: 'totalSupply' as const },
      { address: farmAddress, chainId, abi: stakingRewardsAbi, functionName: 'rewardRate' as const },
      { address: farmAddress, chainId, abi: stakingRewardsAbi, functionName: 'periodFinish' as const },
    ],
    query: { enabled: validFarm },
  })

  const pick = <T>(i: number): T | undefined => {
    const entry = coreRead.data?.[i]
    return entry && entry.status === 'success' ? (entry.result as T) : undefined
  }
  const stakingToken = pick<Address>(0)
  const rewardsToken = pick<Address>(1)
  const totalStaked = pick<bigint>(2)
  const rewardRate = pick<bigint>(3)
  const periodFinish = pick<bigint>(4)

  /* --------------------------------------------------------------- user reads (need wallet) */

  const userRead = useReadContracts({
    contracts: [
      {
        address: farmAddress,
        chainId,
        abi: stakingRewardsAbi,
        functionName: 'earned' as const,
        args: owner ? [owner] : undefined,
      },
      {
        address: farmAddress,
        chainId,
        abi: stakingRewardsAbi,
        functionName: 'balanceOf' as const,
        args: owner ? [owner] : undefined,
      },
    ],
    query: { enabled: validFarm && Boolean(owner) },
  })
  const earned = userRead.data?.[0]?.status === 'success' ? (userRead.data[0].result as bigint) : undefined
  const staked = userRead.data?.[1]?.status === 'success' ? (userRead.data[1].result as bigint) : undefined

  /* --------------------------------------------------------------- token metadata */

  const metaRead = useReadContracts({
    contracts: [
      { address: stakingToken, chainId, abi: erc20Abi, functionName: 'decimals' as const },
      { address: stakingToken, chainId, abi: erc20Abi, functionName: 'symbol' as const },
      { address: rewardsToken, chainId, abi: erc20Abi, functionName: 'decimals' as const },
      { address: rewardsToken, chainId, abi: erc20Abi, functionName: 'symbol' as const },
    ],
    query: { enabled: Boolean(stakingToken && rewardsToken) },
  })
  const stakingDecimals = metaRead.data?.[0]?.status === 'success' ? (metaRead.data[0].result as number) : undefined
  const stakingSymbol = metaRead.data?.[1]?.status === 'success' ? (metaRead.data[1].result as string) : undefined
  const rewardDecimals = metaRead.data?.[2]?.status === 'success' ? (metaRead.data[2].result as number) : undefined
  const rewardSymbol = metaRead.data?.[3]?.status === 'success' ? (metaRead.data[3].result as string) : undefined

  /* --------------------------------------------------------------- amounts + validity */

  const stakeRaw = tryParse(stakeAmount, stakingDecimals)
  const unstakeRaw = tryParse(unstakeAmount, stakingDecimals)
  const validStake = stakeRaw !== undefined && stakeRaw > 0n
  const validUnstake = unstakeRaw !== undefined && unstakeRaw > 0n && staked !== undefined && unstakeRaw <= staked

  /* --------------------------------------------------------------- stake allowance gate */

  const allowanceRead = useReadContract({
    address: stakingToken,
    chainId,
    abi: erc20Abi,
    functionName: 'allowance',
    args: owner && farmAddress ? [owner, farmAddress] : undefined,
    query: { enabled: Boolean(stakingToken && owner && farmAddress) },
  })
  const allowance = allowanceRead.data as bigint | undefined
  const allowanceKnown = allowance !== undefined
  const needsApproval = stakeRaw !== undefined && allowance !== undefined && allowance < stakeRaw

  /* --------------------------------------------------------------- writes (one at a time) */

  const { writeContractAsync, isPending: isWritePending } = useWriteContract()
  const [pendingAction, setPendingAction] = useState<FarmAction | undefined>(undefined)
  const [actionHash, setActionHash] = useState<Hash | undefined>(undefined)
  const [actionError, setActionError] = useState<string | undefined>(undefined)

  const actionReceipt = useWaitForTransactionReceipt({ hash: actionHash, chainId })
  const busy = isWritePending || (Boolean(actionHash) && actionReceipt.isLoading)

  const refetch = (): void => {
    void coreRead.refetch()
    void userRead.refetch()
    void allowanceRead.refetch()
  }

  // Once a write confirms, refresh from chain state (never optimistic) and clear the pending slot.
  useEffect(() => {
    if (actionReceipt.isSuccess) {
      void coreRead.refetch()
      void userRead.refetch()
      void allowanceRead.refetch()
      setActionHash(undefined)
      setPendingAction(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionReceipt.isSuccess])

  const run = async (action: FarmAction, send: () => Promise<Hash>): Promise<void> => {
    if (busy) {
      return
    }
    setActionError(undefined)
    setPendingAction(action)
    try {
      const hash = await send()
      setActionHash(hash)
    } catch (e) {
      setActionError(toMessage(e))
      setPendingAction(undefined)
    }
  }

  const canApprove = validFarm && Boolean(owner) && validStake && needsApproval && !busy
  const canStake = validFarm && Boolean(owner) && validStake && allowanceKnown && !needsApproval && !busy
  const canClaim = validFarm && Boolean(owner) && earned !== undefined && earned > 0n && !busy
  const canWithdraw = validFarm && Boolean(owner) && validUnstake && !busy

  const approve = async (): Promise<void> => {
    if (!canApprove || stakingToken === undefined || farmAddress === undefined || stakeRaw === undefined) {
      return
    }
    await run('approve', () =>
      writeContractAsync({
        address: stakingToken,
        chainId,
        abi: erc20Abi,
        functionName: 'approve',
        args: [farmAddress, stakeRaw],
      }),
    )
  }

  const stake = async (): Promise<void> => {
    if (!canStake || farmAddress === undefined || stakeRaw === undefined) {
      return
    }
    await run('stake', () =>
      writeContractAsync({
        address: farmAddress,
        chainId,
        abi: stakingRewardsAbi,
        functionName: 'stake',
        args: [stakeRaw],
      }),
    )
  }

  const claim = async (): Promise<void> => {
    if (!canClaim || farmAddress === undefined) {
      return
    }
    await run('claim', () =>
      writeContractAsync({
        address: farmAddress,
        chainId,
        abi: stakingRewardsAbi,
        functionName: 'getReward',
        args: [],
      }),
    )
  }

  const withdraw = async (): Promise<void> => {
    if (!canWithdraw || farmAddress === undefined || unstakeRaw === undefined) {
      return
    }
    await run('withdraw', () =>
      writeContractAsync({
        address: farmAddress,
        chainId,
        abi: stakingRewardsAbi,
        functionName: 'withdraw',
        args: [unstakeRaw],
      }),
    )
  }

  const isLoadingCore = validFarm && coreRead.isLoading

  return useMemo(
    () => ({
      validFarm,
      farmAddress,
      stakingToken,
      rewardsToken,
      stakingSymbol,
      stakingDecimals,
      rewardSymbol,
      rewardDecimals,
      staked,
      totalStaked,
      earned,
      rewardRate,
      periodFinish,
      isLoadingCore,
      error: Boolean(coreRead.error),
      refetch,
      stakeRaw,
      unstakeRaw,
      validStake,
      validUnstake,
      needsApproval,
      allowanceKnown,
      canApprove,
      canStake,
      canClaim,
      canWithdraw,
      approve,
      stake,
      claim,
      withdraw,
      pendingAction,
      actionError,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      validFarm,
      farmAddress,
      stakingToken,
      rewardsToken,
      stakingSymbol,
      stakingDecimals,
      rewardSymbol,
      rewardDecimals,
      staked,
      totalStaked,
      earned,
      rewardRate,
      periodFinish,
      isLoadingCore,
      coreRead.error,
      stakeRaw,
      unstakeRaw,
      validStake,
      validUnstake,
      needsApproval,
      allowanceKnown,
      canApprove,
      canStake,
      canClaim,
      canWithdraw,
      pendingAction,
      actionError,
    ],
  )
}
