import { Prettify } from 'viem'
import { z } from 'zod'

// Input types based on https://dev.jup.ag/docs/api/ultra-api/order, although some are missing from their documentation.
// Non-documented fields are discoverable via inspecting jup.ag's network requests.

export type JupiterOrderUrlParams = {
  inputMint: string
  outputMint: string
  amount: string
  taker?: string
  referralAccount?: string
  referralFee?: string
  slippageBps?: string
  swapMode: 'ExactIn' | 'ExactOut'
}

// Output types derived from https://dev.jup.ag/docs/api/ultra-api/order
// Some unused fields are commented out for potential future use.

const swapInfoSchema = z.looseObject({
  ammKey: z.string().nullish(),
  label: z.string().nullish(),
  inputMint: z.string(),
  outputMint: z.string(),
})

const routePlanSchema = z.array(
  z.looseObject({
    swapInfo: swapInfoSchema,
    percent: z.number(),
  }),
)

const platformFeeSchema = z.looseObject({
  // amount: z.string(), // amount is documented as required but occasionally returns undefined -- we calculate it on our own
  feeBps: z.number().nullish(),
})

const routerTypeSchema = z.string().transform((val) => {
  const normalized = val === 'iris' || val === 'jupiterz' || val === 'dflow' || val === 'okx' ? val : 'unknown'
  return { raw: val, normalized } as const
})

export const jupiterOrderResponseSchema = z.looseObject({
  inputMint: z.string(),
  outputMint: z.string(),
  inAmount: z.string(),
  outAmount: z.string(),
  otherAmountThreshold: z.string(),
  swapMode: z.enum(['ExactIn', 'ExactOut']),
  slippageBps: z.number(),
  priceImpactPct: z.string().nullish(),
  routePlan: routePlanSchema.nullish(),
  // Represents just swap fee
  platformFee: platformFeeSchema.nullish(),
  // feeBps: z.number().nullish(), // `response.feeBps` represents total fee (for example, swap fee + fee for gasless support); currently we use `response.platformFee` to get the swap fee and ignore gasless support fee specifics.
  feeMint: z.string().nullish(),
  prioritizationFeeLamports: z.number(),
  router: routerTypeSchema,
  transaction: z.string().nullish(),
  gasless: z.boolean().nullish(),
  requestId: z.string(),
  // totalTime: z.number(),
  taker: z.string().nullish(),
  quoteId: z.string().nullish(),
  maker: z.string().nullish(),
  // expireAt: z.string().nullish(),
  // dynamicSlippageReport: dynamicSlippageReportSchema.nullish(),
  errorMessage: z.string().nullish(),
  errorCode: z.number().nullish(),
})

export type JupiterOrderResponse = Prettify<z.infer<typeof jupiterOrderResponseSchema>>

// Types derived from https://dev.jup.ag/docs/api/ultra-api/execute

const StatusEnum = z.enum(['Success', 'Failed'])

export const jupiterExecuteResponseSchema = z.looseObject({
  status: StatusEnum,
  signature: z.string().nullish(),
  error: z.string().nullish(),
  code: z.number(),
})

export type JupiterExecuteResponse = z.infer<typeof jupiterExecuteResponseSchema>

export type JupiterExecuteUrlParams = {
  signedTransaction: string
  requestId: string
}
