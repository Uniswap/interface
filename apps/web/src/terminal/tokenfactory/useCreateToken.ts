/**
 * HookSwap Terminal — client-side ERC-20 launch (HookSwapTokenFactory).
 *
 * Self-contained CLIENT-SIDE flow (NO backend, NO Permit2, NO approval): a single
 * `createToken(name, symbol, decimals, supply)` write against the deployed
 * `HookSwapTokenFactory` deploys a fresh fixed-supply `HookSwapERC20`, minting the full
 * supply to the caller. See `contracts/token-factory/src/HookSwapTokenFactory.sol`.
 *
 * Semantics (mirrors the contract + `~/terminal/pools/useCreateV2Pool`):
 *   • Supply is entered in whole tokens and scaled by `parseUnits(supply, decimals)` to
 *     base units — exactly the `supply_` the contract mints.
 *   • An optional native `createFee` (0 = free) is read on-chain and forwarded as `value`.
 *   • On success the `TokenCreated(token, creator, name, symbol)` log is decoded straight
 *     from the receipt (viem `parseEventLogs`) → the new token address is exposed so the UI
 *     can hand off to pool creation. No fabricated address.
 *
 * All reads/writes are REAL (wagmi). A single write, so there is no approval gate.
 */
import { useEffect, useMemo, useState } from 'react'
import { parseEventLogs } from 'viem'
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { parseUnits, type Address, type Hash } from '~/chains'
import { tokenFactoryAbi } from '~/terminal/tokenfactory/abis'
import { getTokenFactoryAddress } from '~/terminal/tokenfactory/addresses'

export interface UseCreateToken {
  /** True when the chain has a deployed HookSwapTokenFactory (address present). */
  ready: boolean
  /** Resolved factory address, or undefined when not deployed on this chain. */
  factory?: Address
  /** Native create fee (raw), or undefined while loading. 0n = free. */
  createFee?: bigint
  /** Parsed supply in base units (`supply * 10**decimals`), or undefined when invalid. */
  supplyRaw?: bigint

  // Create.
  inputsValid: boolean
  canCreate: boolean
  create: () => Promise<void>
  isWritePending: boolean
  createHash?: Hash
  isConfirming: boolean
  isDone: boolean
  /** Address of the freshly deployed token, decoded from the TokenCreated log. */
  createdTokenAddress?: Address
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

export function useCreateToken({
  chainId,
  owner,
  name,
  symbol,
  decimals,
  supply,
}: {
  chainId?: number
  owner?: Address
  name: string
  symbol: string
  decimals: number
  supply: string
}): UseCreateToken {
  const factory = getTokenFactoryAddress(chainId)
  const ready = Boolean(factory)

  const supplyRaw = tryParse(supply, decimals)

  /* --------------------------------------------------------------- create fee */

  const createFeeRead = useReadContract({
    address: factory,
    chainId,
    abi: tokenFactoryAbi,
    functionName: 'createFee',
    query: { enabled: ready },
  })
  const createFee = createFeeRead.data as bigint | undefined

  /* --------------------------------------------------------------- write */

  const { writeContractAsync, isPending: isWritePending } = useWriteContract()

  const [createHash, setCreateHash] = useState<Hash | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const [createdTokenAddress, setCreatedTokenAddress] = useState<Address | undefined>(undefined)

  const createReceipt = useWaitForTransactionReceipt({ hash: createHash, chainId })
  const isConfirming = Boolean(createHash) && createReceipt.isLoading
  const isDone = Boolean(createHash) && createReceipt.isSuccess

  // Decode the deployed token address from the TokenCreated log once the receipt lands.
  useEffect(() => {
    if (!createReceipt.isSuccess || !createReceipt.data) {
      return
    }
    try {
      const events = parseEventLogs({
        abi: tokenFactoryAbi,
        logs: createReceipt.data.logs,
        eventName: 'TokenCreated',
      })
      const created = events[0]
      if (created && 'args' in created && created.args.token) {
        setCreatedTokenAddress(created.args.token as Address)
      }
    } catch {
      // Leave createdTokenAddress undefined — the tx still succeeded; the UI shows the
      // success state without the address rather than fabricating one.
    }
  }, [createReceipt.isSuccess, createReceipt.data])

  const nameTrim = name.trim()
  const symbolTrim = symbol.trim()
  const inputsValid = Boolean(
    ready && owner && factory && nameTrim !== '' && symbolTrim !== '' && supplyRaw !== undefined && supplyRaw > 0n,
  )
  const canCreate = inputsValid && !isWritePending && !isConfirming && !isDone

  const create = async (): Promise<void> => {
    if (!canCreate || !factory || supplyRaw === undefined) {
      return
    }
    setError(undefined)
    try {
      const hash = await writeContractAsync({
        address: factory,
        chainId,
        abi: tokenFactoryAbi,
        functionName: 'createToken',
        args: [nameTrim, symbolTrim, decimals, supplyRaw],
        // Forward the native create fee when the factory charges one (0 = free).
        value: createFee ?? 0n,
      })
      setCreateHash(hash)
    } catch (e) {
      setError(toMessage(e))
    }
  }

  const reset = (): void => {
    setCreateHash(undefined)
    setError(undefined)
    setCreatedTokenAddress(undefined)
  }

  return useMemo(
    () => ({
      ready,
      factory,
      createFee,
      supplyRaw,
      inputsValid,
      canCreate,
      create,
      isWritePending,
      createHash,
      isConfirming,
      isDone,
      createdTokenAddress,
      error,
      reset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      ready,
      factory,
      createFee,
      supplyRaw,
      inputsValid,
      canCreate,
      isWritePending,
      createHash,
      isConfirming,
      isDone,
      createdTokenAddress,
      error,
    ],
  )
}
