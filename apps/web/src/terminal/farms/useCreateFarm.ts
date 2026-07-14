/**
 * HookSwap Terminal — client-side staking-farm creation (StakingRewardsFactory).
 *
 * Self-contained CLIENT-SIDE flow (NO backend, NO Permit2): `createAndFund` PULLS the reward
 * budget out of the caller with `SafeERC20.safeTransferFrom(msg.sender, farm, rewardAmount)`,
 * so — exactly like `~/terminal/vesting/useCreateVesting` and `~/terminal/pools/useCreateV2Pool`
 * — the write is GATED behind a plain ERC-20 allowance on the REWARD token:
 * `approve(factory, rewardAmount)` → `createAndFund(...)`.
 * See `contracts/farms/src/StakingRewardsFactory.sol`.
 *
 * Semantics (mirrors the contract):
 *   • The staking + reward tokens' `decimals` / `symbol` are REAL on-chain reads off the pasted
 *     addresses; the human reward amount is scaled with `parseUnits(amount, rewardDecimals)`
 *     into the exact `rewardAmount` the contract pulls. Nothing is assumed about a token.
 *   • `duration` is a length in SECONDS. The contract requires `stakingToken != rewardToken`,
 *     `rewardAmount > 0`, `duration > 0` — all validated here so a tx can never be signed while
 *     it would revert.
 *   • The allowance is re-read after the approve receipt lands, so `needsApproval` flips only
 *     once the approval is CONFIRMED on-chain — never optimistically.
 *   • On success the new farm address is decoded from the `FarmCreated` event, which the factory
 *     emits from ITS OWN address (so we read it off the log whose `address == factory`, farm =
 *     first indexed topic) — no keccak/event-hash needed.
 *
 * All reads/writes are REAL (wagmi).
 */
import { useEffect, useMemo, useState } from 'react'
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { erc20Abi, getAddress, isAddress, parseUnits, type Address, type Hash } from '~/chains'
import { stakingRewardsFactoryAbi } from '~/terminal/farms/abis'
import { getFarmFactory } from '~/terminal/farms/addresses'
import { assume0xAddress } from '~/utils/wagmi'

export interface UseCreateFarm {
  /** True when the chain has a deployed StakingRewardsFactory (address present). */
  ready: boolean
  /** Resolved factory address, or undefined when not deployed on this chain. */
  factory?: Address

  // Staking token (real on-chain reads off the pasted address).
  validStakingToken: boolean
  stakingDecimals?: number
  stakingSymbol?: string

  // Reward token (real on-chain reads off the pasted address).
  validRewardToken: boolean
  rewardDecimals?: number
  rewardSymbol?: string
  /** Parsed reward budget in base units (`amount * 10**rewardDecimals`), or undefined. */
  rewardAmountRaw?: bigint

  // Field-level validity (drives honest inline errors).
  validAmount: boolean
  validDuration: boolean
  /** Contract invariant: `stakingToken != rewardToken`. */
  distinctTokens: boolean

  // Allowance gate — createAndFund pulls `rewardAmount` of the reward token via transferFrom.
  needsApproval: boolean
  /** True once the live allowance read has resolved (so the UI can say "Checking approval…"). */
  allowanceKnown: boolean
  approving: boolean
  canApprove: boolean
  approve: () => Promise<void>

  // Create.
  inputsValid: boolean
  canCreate: boolean
  create: () => Promise<void>
  isWritePending: boolean
  createHash?: Hash
  isConfirming: boolean
  isDone: boolean
  /** Address of the farm deployed by the last successful create (decoded from FarmCreated). */
  createdFarm?: Address
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

/** A 32-byte indexed address topic → checksummed address (last 20 bytes). */
function topicToAddress(topic?: string): Address | undefined {
  if (!topic || topic.length < 42) {
    return undefined
  }
  try {
    return getAddress(`0x${topic.slice(-40)}`) as Address
  } catch {
    return undefined
  }
}

export function useCreateFarm({
  chainId,
  owner,
  stakingToken,
  rewardToken,
  rewardAmount,
  durationSeconds,
}: {
  chainId?: number
  owner?: Address
  /** Pasted ERC-20 address users will stake. */
  stakingToken: string
  /** Pasted ERC-20 address paid out as rewards. */
  rewardToken: string
  /** Human reward budget (whole tokens); scaled by the reward token's on-chain decimals. */
  rewardAmount: string
  /** Reward-stream length in seconds. */
  durationSeconds?: number
}): UseCreateFarm {
  const factory = getFarmFactory(chainId)
  const ready = Boolean(factory)

  const validStakingToken = isAddress(stakingToken)
  const validRewardToken = isAddress(rewardToken)
  const stakingAddr = assume0xAddress(validStakingToken ? stakingToken : undefined)
  const rewardAddr = assume0xAddress(validRewardToken ? rewardToken : undefined)

  /* --------------------------------------------------------------- staking token reads */

  const stakingDecimalsRead = useReadContract({
    address: stakingAddr,
    chainId,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: ready && validStakingToken },
  })
  const stakingDecimals = stakingDecimalsRead.data as number | undefined

  const stakingSymbolRead = useReadContract({
    address: stakingAddr,
    chainId,
    abi: erc20Abi,
    functionName: 'symbol',
    query: { enabled: ready && validStakingToken },
  })
  const stakingSymbol = stakingSymbolRead.data as string | undefined

  /* --------------------------------------------------------------- reward token reads */

  const rewardDecimalsRead = useReadContract({
    address: rewardAddr,
    chainId,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: ready && validRewardToken },
  })
  const rewardDecimals = rewardDecimalsRead.data as number | undefined

  const rewardSymbolRead = useReadContract({
    address: rewardAddr,
    chainId,
    abi: erc20Abi,
    functionName: 'symbol',
    query: { enabled: ready && validRewardToken },
  })
  const rewardSymbol = rewardSymbolRead.data as string | undefined

  const rewardAmountRaw = tryParse(rewardAmount, rewardDecimals)

  /* --------------------------------------------------------------- allowance gate (reward token) */

  const allowanceRead = useReadContract({
    address: rewardAddr,
    chainId,
    abi: erc20Abi,
    functionName: 'allowance',
    args: owner && factory ? [owner, factory] : undefined,
    query: { enabled: ready && validRewardToken && Boolean(owner && factory) },
  })
  const allowance = allowanceRead.data as bigint | undefined
  const allowanceKnown = allowance !== undefined
  const needsApproval = rewardAmountRaw !== undefined && allowance !== undefined && allowance < rewardAmountRaw

  /* --------------------------------------------------------------- writes */

  const { writeContractAsync, isPending: isWritePending } = useWriteContract()

  const [approveHash, setApproveHash] = useState<Hash | undefined>(undefined)
  const [createHash, setCreateHash] = useState<Hash | undefined>(undefined)
  const [createdFarm, setCreatedFarm] = useState<Address | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)

  const approveReceipt = useWaitForTransactionReceipt({ hash: approveHash, chainId })
  const createReceipt = useWaitForTransactionReceipt({ hash: createHash, chainId })

  const approving = Boolean(approveHash) && approveReceipt.isLoading
  const isConfirming = Boolean(createHash) && createReceipt.isLoading
  const isDone = Boolean(createHash) && createReceipt.isSuccess

  // Re-read the live allowance once the approval is CONFIRMED — never flip the gate optimistically.
  useEffect(() => {
    if (approveReceipt.isSuccess) {
      void allowanceRead.refetch()
      setApproveHash(undefined)
    }
  }, [approveReceipt.isSuccess, allowanceRead])

  // createAndFund spends the allowance, so refresh it after the farm lands, and decode the farm
  // address from the FarmCreated log (emitted from the factory's own address).
  useEffect(() => {
    if (createReceipt.isSuccess && createReceipt.data && factory) {
      void allowanceRead.refetch()
      const factoryLower = factory.toLowerCase()
      const log = createReceipt.data.logs.find(
        (l) => l.address.toLowerCase() === factoryLower && l.topics.length >= 2,
      )
      const farm = topicToAddress(log?.topics[1])
      if (farm) {
        setCreatedFarm(farm)
      }
    }
  }, [createReceipt.isSuccess, createReceipt.data, factory, allowanceRead])

  /* --------------------------------------------------------------- validation */

  const validAmount = rewardAmountRaw !== undefined && rewardAmountRaw > 0n
  const validDuration = durationSeconds !== undefined && durationSeconds > 0
  const distinctTokens =
    !validStakingToken || !validRewardToken || stakingToken.toLowerCase() !== rewardToken.toLowerCase()

  const inputsValid = Boolean(
    ready &&
      owner &&
      factory &&
      validStakingToken &&
      validRewardToken &&
      distinctTokens &&
      rewardDecimals !== undefined &&
      validAmount &&
      validDuration,
  )

  const busy = isWritePending || isConfirming || approving
  const canApprove = inputsValid && needsApproval && !busy
  const canCreate = inputsValid && allowanceKnown && !needsApproval && !busy && !isDone

  /* --------------------------------------------------------------- actions */

  const approve = async (): Promise<void> => {
    if (!canApprove || rewardAddr === undefined || !factory || rewardAmountRaw === undefined) {
      return
    }
    setError(undefined)
    try {
      const hash = await writeContractAsync({
        address: rewardAddr,
        chainId,
        abi: erc20Abi,
        functionName: 'approve',
        args: [factory, rewardAmountRaw],
      })
      setApproveHash(hash)
    } catch (e) {
      setError(toMessage(e))
    }
  }

  const create = async (): Promise<void> => {
    if (
      !canCreate ||
      !factory ||
      stakingAddr === undefined ||
      rewardAddr === undefined ||
      rewardAmountRaw === undefined ||
      durationSeconds === undefined
    ) {
      return
    }
    setError(undefined)
    try {
      const hash = await writeContractAsync({
        address: factory,
        chainId,
        abi: stakingRewardsFactoryAbi,
        functionName: 'createAndFund',
        args: [stakingAddr, rewardAddr, rewardAmountRaw, BigInt(Math.floor(durationSeconds))],
      })
      setCreateHash(hash)
    } catch (e) {
      setError(toMessage(e))
    }
  }

  const reset = (): void => {
    setCreateHash(undefined)
    setApproveHash(undefined)
    setCreatedFarm(undefined)
    setError(undefined)
  }

  return useMemo(
    () => ({
      ready,
      factory,
      validStakingToken,
      stakingDecimals,
      stakingSymbol,
      validRewardToken,
      rewardDecimals,
      rewardSymbol,
      rewardAmountRaw,
      validAmount,
      validDuration,
      distinctTokens,
      needsApproval,
      allowanceKnown,
      approving,
      canApprove,
      approve,
      inputsValid,
      canCreate,
      create,
      isWritePending,
      createHash,
      isConfirming,
      isDone,
      createdFarm,
      error,
      reset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      ready,
      factory,
      validStakingToken,
      stakingDecimals,
      stakingSymbol,
      validRewardToken,
      rewardDecimals,
      rewardSymbol,
      rewardAmountRaw,
      validAmount,
      validDuration,
      distinctTokens,
      needsApproval,
      allowanceKnown,
      approving,
      canApprove,
      inputsValid,
      canCreate,
      isWritePending,
      createHash,
      isConfirming,
      isDone,
      createdFarm,
      error,
    ],
  )
}
