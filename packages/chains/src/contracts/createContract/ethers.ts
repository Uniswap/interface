import { BigNumber } from '@ethersproject/bignumber'
import { Contract, type ContractInterface } from '@ethersproject/contracts'
import type { Abi, Hash } from 'viem'
import { z } from 'zod'
import { type ChainContract, type EthersChainContractParams, getWriteParameters } from './shared'

type DecodedValue = string | number | boolean | null | undefined

type EthersDecodedValue = DecodedValue | BigNumber | EthersDecodedValue[]

type ViemDecodedValue = DecodedValue | bigint | ViemDecodedValue[] | ViemDecodedValueRecord

// Can't be a strict alias
interface ViemDecodedValueRecord {
  [key: string]: ViemDecodedValue
}

// The closed set of values ethers v5 ABI decoding can produce.
const EthersDecodedValueSchema: z.ZodType<EthersDecodedValue> = z.lazy(() =>
  z.union([
    z.custom<BigNumber>(BigNumber.isBigNumber),
    // Lazy for the recursive definition
    z.array(EthersDecodedValueSchema),
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.undefined(),
  ]),
)

/**
 * Named keys that aren't length or "numbers"
 */
function getNamedResultKeys(value: EthersDecodedValue[]): string[] {
  return Object.keys(value).filter((key) => key !== 'length' && Number.isNaN(Number(key)))
}

/**
 * Recursively converts ethers return
 * values to their viem equivalents.
 *
 * - `BigNumber` - `bigint`
 * - ethers `Result` (array with named accessors) -> plain object keyed
 * - plain array (tuple return, no named keys) -> `Array<converted>`
 * - everything else -> passthrough
 */
function ethersToViemValue(value: EthersDecodedValue): ViemDecodedValue {
  if (value == null) {
    return value
  }
  if (BigNumber.isBigNumber(value)) {
    return value.toBigInt()
  }
  if (Array.isArray(value)) {
    const named = getNamedResultKeys(value)
    if (named.length > 0) {
      // Named accessors on an ethers `Result` alias its indexed elements,
      // so the values behind them were validated along with the array.
      const record = value as unknown as Record<string, EthersDecodedValue>
      const out: ViemDecodedValueRecord = {}
      for (const key of named) {
        out[key] = ethersToViemValue(record[key])
      }
      return out
    }
    // Plain array (no named keys)
    return value.map(ethersToViemValue)
  }
  return value
}

/**
 * Type guard checking a value what we expect from ethers
 */
function isEthersDecodedValue(value: unknown): value is EthersDecodedValue {
  return EthersDecodedValueSchema.safeParse(value).success
}

/**
 * Parses and converts an ethers type to viem one,
 * otherwise throws strictly with a more useful error
 */
function toViemResult(value: unknown): ViemDecodedValue {
  // This should never happen but it's a
  // runtime thing so we prefer to check it
  if (!isEthersDecodedValue(value)) {
    throw new Error('Unexpected result shape from ethers')
  }
  return ethersToViemValue(value)
}

/**
 * Ethers-side path. Builds a `Contract` and exposes a
 * viem-shape `{ read, write, simulate }` over it via Proxy.
 */
export function createEthersContract<TAbi extends Abi>(params: EthersChainContractParams<TAbi>): ChainContract<TAbi> {
  const { address, abi, provider, signer } = params
  // Writes go through an unchecked signer, implicit before w/ `getContract`.
  // Matches viem (which returns the hash without polling afterwards.
  const contract = new Contract(
    address,
    abi as unknown as ContractInterface,
    signer ? signer.connectUnchecked() : provider,
  )

  // Just a fancy way to dynamically dispatch. We don't know the
  // contract at compile time, we want to call anything at runtime.
  const read = new Proxy(
    {},
    {
      get(_target, fnName: string) {
        return async (args: readonly unknown[] = []) => {
          const result: unknown = await contract.callStatic[fnName]?.(...args)
          return toViemResult(result)
        }
      },
    },
  )

  const write = new Proxy(
    {},
    {
      get(_target, fnName: string) {
        return async (...parameters: readonly unknown[]) => {
          const { args, options } = getWriteParameters(parameters)
          // Caller expects viem types, but we might not be able to handle.
          // `chain`/`account` are per-call overrides only the viem engine can
          // honor, ethers binds both to the signer. Throw rather than send a
          // transaction that silently ignores what the caller asked for.
          if ('chain' in options || 'account' in options) {
            throw new Error(`ethers doesn't support some write overrides`)
          }
          const tx = await contract[fnName]?.(...args, ...(Object.keys(options).length > 0 ? [options] : []))
          return tx.hash as Hash
        }
      },
    },
  )

  const simulate = new Proxy(
    {},
    {
      get(_target, fnName: string) {
        return async (args: readonly unknown[] = []) => {
          const result: unknown = await contract.callStatic[fnName]?.(...args)
          return {
            result: toViemResult(result),
            request: { address, abi, functionName: fnName, args },
          }
        }
      },
    },
  )

  // viem's `GetContractReturnType` is too narrow to express above
  // proxies. The runtime surface matches what callers observe.
  return { address, abi, read, write, simulate } as unknown as ChainContract<TAbi>
}
