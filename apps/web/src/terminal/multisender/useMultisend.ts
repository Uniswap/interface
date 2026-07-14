/**
 * HookSwap Terminal — client-side batch send (Multisender / Disperse).
 *
 * Self-contained CLIENT-SIDE flow (NO backend, NO Permit2): send one ERC-20 (or the
 * native currency) to many recipients in a single tx against the deployed stateless
 * `Disperse` contract (`contracts/multisender/src/Disperse.sol`).
 *
 * Semantics (mirrors the contract + `~/terminal/pools/useCreateV2Pool`):
 *   • ERC-20 → approve the SUM to the Disperse contract once (plain ERC-20 allowance, no
 *     Permit2), then `disperseToken(token, recipients, amounts)` pulls per recipient.
 *   • Native → no approval; `disperseEther(recipients, amounts){ value: total }`.
 *   • Block-gas honesty: a single tx caps at {@link MAX_PER_TX} recipients. Longer lists
 *     are CHUNKED into sequential txs, each awaited before the next, with live
 *     "Batch n of N" progress — never one oversized tx that would revert.
 *
 * All reads/writes are REAL (wagmi). The send is gated behind the required allowance +
 * sufficient balance so a tx can never be signed while it would revert.
 */
import { waitForTransactionReceipt } from '@wagmi/core'
import { useEffect, useMemo, useState } from 'react'
import { useBalance, useConfig, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { erc20Abi, type Address, type Hash } from '~/chains'
import { disperseAbi } from '~/terminal/multisender/abis'
import { getDisperseAddress } from '~/terminal/multisender/addresses'
import { assume0xAddress } from '~/utils/wagmi'

/**
 * Max recipients per transaction. Batch sends fan out to `N` calldata words + `N` token
 * transfers; ~250 keeps a single tx comfortably under mainnet-class block gas limits.
 * Longer lists are chunked into sequential txs.
 */
export const MAX_PER_TX = 250

export interface MultisendEntry {
  recipient: Address
  /** Raw amount in the token's base units (already parsed by the caller). */
  amount: bigint
}

export interface MultisendToken {
  /** ERC-20 address, or the NATIVE sentinel (`NATIVE_CHAIN_ID`) for the native currency. */
  address?: string
  decimals?: number
  symbol?: string
}

export interface UseMultisend {
  /** True when the chain has a deployed Disperse contract (address present). */
  ready: boolean
  /** Resolved Disperse contract address, or undefined when not deployed on this chain. */
  disperse?: Address
  /** The token side is the chain's native currency (needs no approval). */
  isNative: boolean
  /** Sum of all entry amounts (raw). */
  total: bigint
  /** Number of sequential txs the send will take (chunked at MAX_PER_TX). */
  chunkCount: number

  // Balance
  /** Caller's balance of the selected token (raw), or undefined while loading. */
  balance?: bigint
  /** True when `total` exceeds the caller's balance. */
  insufficientBalance: boolean

  // Approval gate (ERC-20 only; native has no gate).
  needsApproval: boolean
  approving: boolean
  approve: () => Promise<void>

  // Send.
  canSend: boolean
  send: () => Promise<void>
  /** A send sequence is in progress (wallet-confirm or mining, any batch). */
  isSending: boolean
  isConfirming: boolean
  /** 1-based index of the batch currently sending (0 when idle). */
  batchIndex: number
  /** Total batches in the active/last send. */
  batchCount: number
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

function chunk<T>(arr: readonly T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

export function useMultisend({
  chainId,
  owner,
  token,
  entries,
}: {
  chainId?: number
  owner?: Address
  token: MultisendToken
  entries: MultisendEntry[]
}): UseMultisend {
  const config = useConfig()
  const disperse = getDisperseAddress(chainId)
  const ready = Boolean(disperse)

  const isNative = token.address === NATIVE_CHAIN_ID
  const tokenErc20 = !isNative ? assume0xAddress(token.address) : undefined

  const total = useMemo(() => entries.reduce((sum, e) => sum + e.amount, 0n), [entries])
  const chunkCount = entries.length > 0 ? Math.ceil(entries.length / MAX_PER_TX) : 0

  /* --------------------------------------------------------------- balance */

  // Native balance via useBalance; ERC-20 balance via balanceOf.
  const nativeBalanceRead = useBalance({
    address: owner,
    chainId,
    query: { enabled: isNative && Boolean(owner) },
  })
  const erc20BalanceRead = useReadContract({
    address: tokenErc20,
    chainId,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: owner ? [owner] : undefined,
    query: { enabled: !isNative && Boolean(tokenErc20 && owner) },
  })
  const balance = isNative ? nativeBalanceRead.data?.value : (erc20BalanceRead.data as bigint | undefined)
  const insufficientBalance = balance !== undefined && total > 0n && balance < total

  /* --------------------------------------------------------------- allowance gate */

  const allowanceRead = useReadContract({
    address: tokenErc20,
    chainId,
    abi: erc20Abi,
    functionName: 'allowance',
    args: owner && disperse ? [owner, disperse] : undefined,
    query: { enabled: ready && !isNative && Boolean(tokenErc20 && owner && disperse) },
  })
  const allowance = allowanceRead.data as bigint | undefined
  const needsApproval = !isNative && total > 0n && allowance !== undefined && allowance < total

  /* --------------------------------------------------------------- writes */

  const { writeContractAsync, isPending: isWritePending } = useWriteContract()

  const [approveHash, setApproveHash] = useState<Hash | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const [isSending, setIsSending] = useState(false)
  const [batchIndex, setBatchIndex] = useState(0)
  const [batchCount, setBatchCount] = useState(0)
  const [isDone, setIsDone] = useState(false)

  const approveReceipt = useWaitForTransactionReceipt({ hash: approveHash, chainId })
  const approving = (Boolean(approveHash) && approveReceipt.isLoading) || (isWritePending && !isSending)

  useEffect(() => {
    if (approveReceipt.isSuccess) {
      void allowanceRead.refetch()
      setApproveHash(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveReceipt.isSuccess])

  const approve = async (): Promise<void> => {
    if (!tokenErc20 || !disperse || total <= 0n) {
      return
    }
    setError(undefined)
    try {
      const hash = await writeContractAsync({
        address: tokenErc20,
        chainId,
        abi: erc20Abi,
        functionName: 'approve',
        args: [disperse, total],
      })
      setApproveHash(hash)
    } catch (e) {
      setError(toMessage(e))
    }
  }

  const inputsValid = Boolean(ready && owner && disperse && entries.length > 0 && total > 0n)
  const canSend = inputsValid && !needsApproval && !insufficientBalance && !isSending && !isWritePending

  const send = async (): Promise<void> => {
    if (!canSend || !disperse || total <= 0n) {
      return
    }
    // ERC-20 path requires a resolved token address (native path doesn't).
    if (!isNative && tokenErc20 === undefined) {
      return
    }
    setError(undefined)
    setIsDone(false)

    const recipients = entries.map((e) => e.recipient)
    const amounts = entries.map((e) => e.amount)
    const recipientChunks = chunk(recipients, MAX_PER_TX)
    const amountChunks = chunk(amounts, MAX_PER_TX)

    setIsSending(true)
    setBatchCount(recipientChunks.length)
    try {
      for (let i = 0; i < recipientChunks.length; i++) {
        setBatchIndex(i + 1)
        const chunkRecipients = recipientChunks[i]
        const chunkAmounts = amountChunks[i]
        const chunkTotal = chunkAmounts.reduce((sum, a) => sum + a, 0n)

        const hash = isNative
          ? await writeContractAsync({
              address: disperse,
              chainId,
              abi: disperseAbi,
              functionName: 'disperseEther',
              args: [chunkRecipients, chunkAmounts],
              value: chunkTotal,
            })
          : await writeContractAsync({
              address: disperse,
              chainId,
              abi: disperseAbi,
              functionName: 'disperseToken',
              args: [tokenErc20 as Address, chunkRecipients, chunkAmounts],
            })

        // Await this batch before sending the next — sequential, honest progress.
        const receipt = await waitForTransactionReceipt(config, { hash, chainId })
        if (receipt.status === 'reverted') {
          throw new Error(`Batch ${i + 1} reverted on-chain`)
        }
      }
      setIsDone(true)
      // Refresh balance + allowance after a successful send.
      if (isNative) {
        void nativeBalanceRead.refetch()
      } else {
        void erc20BalanceRead.refetch()
        void allowanceRead.refetch()
      }
    } catch (e) {
      setError(toMessage(e))
    } finally {
      setIsSending(false)
    }
  }

  const reset = (): void => {
    setApproveHash(undefined)
    setError(undefined)
    setIsSending(false)
    setBatchIndex(0)
    setBatchCount(0)
    setIsDone(false)
  }

  return useMemo(
    () => ({
      ready,
      disperse,
      isNative,
      total,
      chunkCount,
      balance,
      insufficientBalance,
      needsApproval,
      approving,
      approve,
      canSend,
      send,
      isSending,
      isConfirming: isSending,
      batchIndex,
      batchCount,
      isDone,
      error,
      reset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      ready,
      disperse,
      isNative,
      total,
      chunkCount,
      balance,
      insufficientBalance,
      needsApproval,
      approving,
      canSend,
      isSending,
      batchIndex,
      batchCount,
      isDone,
      error,
    ],
  )
}
