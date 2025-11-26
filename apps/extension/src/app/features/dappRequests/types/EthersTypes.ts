import { isHexString } from 'ethers/lib/utils'
import { HexadecimalNumberSchema } from 'src/app/features/dappRequests/types/utilityTypes'
import { z } from 'zod'

/**
 * Ethers types copied from `ethers` package
 */

// eslint-disable-next-line no-restricted-syntax
export const BigNumberSchema = z.any() // TODO (EXT-831): Add schema once stable

const AccessListEntrySchema = z.object({
  address: z.string(),
  storageKeys: z.array(z.string()),
})

const AccessListSchema = z.array(AccessListEntrySchema)

// https://docs.ethers.org/v5/api/utils/bignumber/#BigNumberish
const BigNumberishSchema = z.union([
  z.string(),
  z.instanceof(Uint8Array), // For Uint8Array, covering part of BytesLike.
  z.array(z.number().min(0).max(255)), // For byte arrays (part of BytesLike), assuming bytes are represented as numbers 0-255.
  BigNumberSchema,
  z.number(),
  z.bigint(), // For BigInt, in environments that support BigInt.
])

const BytesLikeSchema = z.string().refine((data) => isHexString(data))

// https://docs.ethers.org/v5/api/providers/types/#types--access-lists
const AccessListishSchema = z.union([
  AccessListSchema,
  z.array(z.tuple([z.string(), z.array(z.string())])), // Array of 2-element Arrays format
  z.record(z.array(z.string())), // Object with addresses as keys and arrays of storage keys as values
])

export const EthersTransactionRequestSchema = z.object({
  to: z.string().optional(),
  from: z.string().optional(),
  nonce: BigNumberishSchema.optional(),
  gasLimit: BigNumberishSchema.optional(),
  gasPrice: BigNumberishSchema.optional(),
  data: BytesLikeSchema.optional(),
  value: BigNumberishSchema.optional(),
  chainId: HexadecimalNumberSchema.optional(),
  type: z.union([z.number(), HexadecimalNumberSchema]).optional(),
  accessList: AccessListishSchema.optional(),
  maxPriorityFeePerGas: BigNumberishSchema.optional(),
  maxFeePerGas: BigNumberishSchema.optional(),
  // eslint-disable-next-line no-restricted-syntax
  customData: z.record(z.any()).optional(),
  ccipReadEnabled: z.boolean().optional(),
})
