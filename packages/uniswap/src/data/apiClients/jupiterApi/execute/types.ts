import { z } from 'zod'

// Types derived from https://dev.jup.ag/docs/api/ultra-api/execute

const StatusEnum = z.enum(['Success', 'Failed'])

const SwapEventSchema = z.object({
  inputMint: z.string(),
  inputAmount: z.string(),
  outputMint: z.string(),
  outputAmount: z.string(),
})

export const jupiterExecuteResponseSchema = z
  .object({
    status: StatusEnum,
    signature: z.string().optional(),
    slot: z.string().optional(),
    error: z.string().optional(),
    code: z.number(),
    totalInputAmount: z.string().optional(),
    totalOutputAmount: z.string().optional(),
    inputAmountResult: z.string().optional(),
    outputAmountResult: z.string().optional(),
    swapEvents: z.array(SwapEventSchema).optional(),
  })
  .passthrough()

export type JupiterExecuteResponse = z.infer<typeof jupiterExecuteResponseSchema>
