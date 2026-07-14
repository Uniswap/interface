/**
 * HookSwap Terminal — client-side vesting-schedule creation (HookSwapVestingManager).
 *
 * Self-contained CLIENT-SIDE flow (NO backend, NO Permit2): `createVesting` PULLS the funding
 * tokens out of the caller with `SafeERC20.safeTransferFrom(msg.sender, child, amount)`, so —
 * exactly like `~/terminal/pools/useCreateV2Pool` and the LockerScreen — the write is GATED
 * behind a plain ERC-20 allowance: `approve(manager, amount)` → `createVesting(...)`.
 * See `contracts/vesting/src/HookSwapVestingManager.sol`.
 *
 * Semantics (mirrors the contract):
 *   • The token's `decimals` / `symbol` are REAL on-chain reads off the pasted address; the
 *     human amount is scaled with `parseUnits(amount, decimals)` into the exact `amount` the
 *     contract pulls. Nothing is assumed about the token.
 *   • `startTime` is an ABSOLUTE unix timestamp; `cliffDuration` / `duration` are seconds
 *     RELATIVE to it. The child requires `duration > 0` and `cliffDuration <= duration`;
 *     the manager requires `amount > 0` — all three are validated here so a tx can never be
 *     signed while it would revert.
 *   • An optional native `vestingFee` (0 = free) is read on-chain and forwarded as `value`.
 *   • The allowance is re-read after the approve receipt lands, so `needsApproval` flips only
 *     once the approval is CONFIRMED on-chain — never optimistically.
 *
 * All reads/writes are REAL (wagmi). Vesting is NON-revocable: creation is one-way.
 */
import { useEffect, useMemo, useState } from 'react'
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { erc20Abi, isAddress, parseUnits, type Address, type Hash } from '~/chains'
import { getVestingAddress } from '~/terminal/vesting/addresses'
import { vestingManagerAbi } from '~/terminal/vesting/abis'
import { assume0xAddress } from '~/utils/wagmi'

export interface UseCreateVesting {
  /** True when the chain has a deployed HookSwapVestingManager (address present). */
  ready: boolean
  /** Resolved manager address, or undefined when not deployed on this chain. */
  manager?: Address
  /** Native create fee (raw), or undefined while loading. 0n = free. */
  vestingFee?: bigint

  // Funding token (real on-chain reads off the pasted address).
  /** True when the pasted token string is a well-formed address. */
  validToken: boolean
  tokenDecimals?: number
  tokenSymbol?: string
  /** Parsed amount in base units (`amount * 10**decimals`), or undefined when invalid. */
  amountRaw?: bigint

  // Field-level validity (drives honest inline errors).
  validBeneficiary: boolean
  validAmount: boolean
  validDuration: boolean
  /** Contract invariant: `cliffDuration <= duration`. */
  validCliff: boolean
  validStart: boolean

  // Allowance gate — createVesting pulls `amount` via transferFrom.
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

export function useCreateVesting({
  chainId,
  owner,
  token,
  beneficiary,
  amount,
  startUnix,
  cliffSeconds,
  durationSeconds,
}: {
  chainId?: number
  owner?: Address
  /** Pasted ERC-20 address of the token being vested. */
  token: string
  /** Pasted address that will receive the vested tokens. */
  beneficiary: string
  /** Human amount (whole tokens); scaled by the token's on-chain decimals. */
  amount: string
  /** Absolute unix seconds the curve starts at. */
  startUnix?: number
  /** Cliff length in seconds, measured from `startUnix`. */
  cliffSeconds?: number
  /** Total vesting length in seconds, measured from `startUnix`. */
  durationSeconds?: number
}): UseCreateVesting {
  const manager = getVestingAddress(chainId)
  const ready = Boolean(manager)

  const validToken = isAddress(token)
  const validBeneficiary = isAddress(beneficiary)
  const tokenAddr = assume0xAddress(validToken ? token : undefined)

  /* --------------------------------------------------------------- funding token reads */

  const decimalsRead = useReadContract({
    address: tokenAddr,
    chainId,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: ready && validToken },
  })
  const tokenDecimals = decimalsRead.data as number | undefined

  const symbolRead = useReadContract({
    address: tokenAddr,
    chainId,
    abi: erc20Abi,
    functionName: 'symbol',
    query: { enabled: ready && validToken },
  })
  const tokenSymbol = symbolRead.data as string | undefined

  const amountRaw = tryParse(amount, tokenDecimals)

  /* --------------------------------------------------------------- vesting fee */

  const feeRead = useReadContract({
    address: manager,
    chainId,
    abi: vestingManagerAbi,
    functionName: 'vestingFee',
    query: { enabled: ready },
  })
  const vestingFee = feeRead.data as bigint | undefined

  /* --------------------------------------------------------------- allowance gate */

  const allowanceRead = useReadContract({
    address: tokenAddr,
    chainId,
    abi: erc20Abi,
    functionName: 'allowance',
    args: owner && manager ? [owner, manager] : undefined,
    query: { enabled: ready && validToken && Boolean(owner && manager) },
  })
  const allowance = allowanceRead.data as bigint | undefined
  const allowanceKnown = allowance !== undefined
  const needsApproval = amountRaw !== undefined && allowance !== undefined && allowance < amountRaw

  /* --------------------------------------------------------------- writes */

  const { writeContractAsync, isPending: isWritePending } = useWriteContract()

  const [approveHash, setApproveHash] = useState<Hash | undefined>(undefined)
  const [createHash, setCreateHash] = useState<Hash | undefined>(undefined)
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

  // createVesting spends the allowance, so refresh it after the schedule lands.
  useEffect(() => {
    if (createReceipt.isSuccess) {
      void allowanceRead.refetch()
    }
  }, [createReceipt.isSuccess, allowanceRead])

  /* --------------------------------------------------------------- validation */

  const validAmount = amountRaw !== undefined && amountRaw > 0n
  const validDuration = durationSeconds !== undefined && durationSeconds > 0
  const validCliff =
    cliffSeconds !== undefined && durationSeconds !== undefined && cliffSeconds >= 0 && cliffSeconds <= durationSeconds
  const validStart = startUnix !== undefined && Number.isFinite(startUnix) && startUnix > 0

  const inputsValid = Boolean(
    ready &&
      owner &&
      manager &&
      validToken &&
      validBeneficiary &&
      tokenDecimals !== undefined &&
      validAmount &&
      validStart &&
      validDuration &&
      validCliff,
  )

  const busy = isWritePending || isConfirming || approving
  const canApprove = inputsValid && needsApproval && !busy
  const canCreate = inputsValid && allowanceKnown && !needsApproval && !busy && !isDone

  /* --------------------------------------------------------------- actions */

  const approve = async (): Promise<void> => {
    if (!canApprove || tokenAddr === undefined || !manager || amountRaw === undefined) {
      return
    }
    setError(undefined)
    try {
      const hash = await writeContractAsync({
        address: tokenAddr,
        chainId,
        abi: erc20Abi,
        functionName: 'approve',
        args: [manager, amountRaw],
      })
      setApproveHash(hash)
    } catch (e) {
      setError(toMessage(e))
    }
  }

  const create = async (): Promise<void> => {
    if (
      !canCreate ||
      !manager ||
      tokenAddr === undefined ||
      amountRaw === undefined ||
      startUnix === undefined ||
      cliffSeconds === undefined ||
      durationSeconds === undefined
    ) {
      return
    }
    setError(undefined)
    try {
      const hash = await writeContractAsync({
        address: manager,
        chainId,
        abi: vestingManagerAbi,
        functionName: 'createVesting',
        args: [
          tokenAddr,
          assume0xAddress(beneficiary) as Address,
          amountRaw,
          BigInt(Math.floor(startUnix)),
          BigInt(Math.floor(cliffSeconds)),
          BigInt(Math.floor(durationSeconds)),
        ],
        // Forward the native vesting fee when the manager charges one (0 = free).
        value: vestingFee ?? 0n,
      })
      setCreateHash(hash)
    } catch (e) {
      setError(toMessage(e))
    }
  }

  const reset = (): void => {
    setCreateHash(undefined)
    setApproveHash(undefined)
    setError(undefined)
  }

  return useMemo(
    () => ({
      ready,
      manager,
      vestingFee,
      validToken,
      tokenDecimals,
      tokenSymbol,
      amountRaw,
      validBeneficiary,
      validAmount,
      validDuration,
      validCliff,
      validStart,
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
      error,
      reset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      ready,
      manager,
      vestingFee,
      validToken,
      tokenDecimals,
      tokenSymbol,
      amountRaw,
      validBeneficiary,
      validAmount,
      validDuration,
      validCliff,
      validStart,
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
      error,
    ],
  )
}
