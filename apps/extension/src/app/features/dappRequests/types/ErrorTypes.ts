import { z } from 'zod'

// Simplified version of the original EthereumRpcError class
export const EthereumRpcErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
})
