import { DappVerificationStatus } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { z } from 'zod'

export const CapabilitySchema = z.record(z.string(), z.unknown())

// CAIP-345 response enrichment schema for wallet_sendCalls
export const Caip345Schema = z.object({
  caip2: z.string(), // Chain identifier in CAIP-2 format (e.g., "eip155:1")
  transactionHashes: z.array(z.string()), // Array of transaction hashes
})

export const CallSchema = z.object({
  to: z.string().optional(),
  data: z.string().optional(),
  value: z.string().optional(),
  capabilities: z.record(z.string(), CapabilitySchema).optional(),
})

export const BatchIdSchema = z
  .string()
  .regex(/^0x/, { message: "String must start with '0x'" })
  .max(8194, { message: "String must not exceed 8194 characters including '0x' prefix" })

export const SendCallsParamsSchema = z.object({
  version: z.string(),
  id: BatchIdSchema.optional(),
  from: z.string().optional(),
  chainId: z.string(),
  calls: z.array(CallSchema),
  capabilities: z.record(z.string(), CapabilitySchema).optional(),
})

export const SendCallsResultSchema = z.object({
  id: z.string(),
  capabilities: z
    .object({
      caip345: Caip345Schema.optional(),
    })
    .passthrough() // Allow other capability fields for future extensibility
    .optional(),
})

export const GetCallsStatusParamsSchema = BatchIdSchema

export const GetCallsStatusTransactionReceiptLogSchema = z.object({
  address: z.string(),
  data: z.string(),
  topics: z.array(z.string()),
})

export const GetCallsStatusTransactionReceiptSchema = z.object({
  logs: z.array(GetCallsStatusTransactionReceiptLogSchema),
  status: z.string(), // Hex 1 or 0 for success or failure
  blockHash: z.string(),
  blockNumber: z.string(),
  gasUsed: z.string(),
  transactionHash: z.string(),
})

export const GetCallsStatusResultSchema = z.object({
  version: z.string(),
  id: z.string(),
  chainId: z.string(),
  status: z.number(), // Status codes as per EIP-5792
  receipts: z.array(GetCallsStatusTransactionReceiptSchema).optional(),
  capabilities: z.record(z.string(), CapabilitySchema).optional(),
})

// Export types for use in other files
export type Capability = z.infer<typeof CapabilitySchema>
export type Caip345 = z.infer<typeof Caip345Schema>
export type Call = z.infer<typeof CallSchema>
export type SendCallsParams = z.infer<typeof SendCallsParamsSchema>
export type SendCallsResult = z.infer<typeof SendCallsResultSchema>
export type GetCallsStatusTransactionReceiptLog = z.infer<typeof GetCallsStatusTransactionReceiptLogSchema>
export type GetCallsStatusTransactionReceipt = z.infer<typeof GetCallsStatusTransactionReceiptSchema>
export type GetCallsStatusParams = z.infer<typeof GetCallsStatusParamsSchema>
export type GetCallsStatusResult = z.infer<typeof GetCallsStatusResultSchema>

export { DappVerificationStatus }

export interface DappConnectionInfo {
  name: string
  url: string
  icon: string | null
}

/**
 * Risk level derived from Blockaid validation classification
 */
export enum TransactionRiskLevel {
  /** No risk detected - benign transaction */
  None = 'none',
  /** Warning level - potentially risky but not malicious */
  Warning = 'warning',
  /** Critical/Malicious - high risk transaction */
  Critical = 'critical',
}

/**
 * Asset information to display in transaction sections
 */
export interface TransactionAsset {
  /** Asset type (ERC20, NATIVE, NFT, etc.) */
  type: string
  /** Contract address */
  address: string
  /** Chain ID */
  chainId: UniverseChainId
  /** Token/NFT symbol or name */
  symbol?: string
  /** Token/NFT name */
  name?: string
  /** Amount as formatted string */
  amount?: string
  /** USD value as formatted string */
  usdValue?: string
  /** Logo/image URL */
  logoUrl?: string
  /** Spender address (for approvals) */
  spenderAddress?: string
}

/**
 * Transaction section types that can be displayed in the transaction preview
 */
export enum TransactionSectionType {
  Sending = 'sending',
  Receiving = 'receiving',
  Approving = 'approving',
}

/**
 * A transaction section to display (e.g., "Sending", "Receiving", "Approving")
 */
export interface TransactionSection {
  type: TransactionSectionType
  assets: TransactionAsset[]
}

/**
 * Parsed transaction data for UI display
 */
export interface ParsedTransactionData {
  sections: TransactionSection[]
  riskLevel: TransactionRiskLevel
}
