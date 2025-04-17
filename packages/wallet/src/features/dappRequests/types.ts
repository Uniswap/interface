import { z } from 'zod'

export const CapabilitySchema = z
  .object({
    optional: z.boolean().optional(),
  })
  .catchall(z.unknown())

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
  capabilities: z.record(z.string(), CapabilitySchema).optional(),
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
export type Call = z.infer<typeof CallSchema>
export type SendCallsParams = z.infer<typeof SendCallsParamsSchema>
export type SendCallsResult = z.infer<typeof SendCallsResultSchema>
export type GetCallsStatusTransactionReceiptLog = z.infer<typeof GetCallsStatusTransactionReceiptLogSchema>
export type GetCallsStatusTransactionReceipt = z.infer<typeof GetCallsStatusTransactionReceiptSchema>
export type GetCallsStatusParams = z.infer<typeof GetCallsStatusParamsSchema>
export type GetCallsStatusResult = z.infer<typeof GetCallsStatusResultSchema>
