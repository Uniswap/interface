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

const swapInfoSchema = z
  .object({
    ammKey: z.string(),
    label: z.string(),
    inputMint: z.string(),
    outputMint: z.string(),
    inAmount: z.string(),
    outAmount: z.string(),
    feeAmount: z.string(),
    feeMint: z.string(),
  })
  .passthrough()

const routePlanSchema = z.array(
  z
    .object({
      swapInfo: swapInfoSchema,
      percent: z.number(),
    })
    .passthrough(),
)

const platformFeeSchema = z
  .object({
    amount: z.string(),
    feeBps: z.number(),
  })
  .passthrough()

// const dynamicSlippageReportSchema = z
//   .object({
//     amplificationRatio: z.string().nullish(),
//     otherAmount: z.number().nullish(),
//     simulatedIncurredSlippageBps: z.number().nullish(),
//     slippageBps: z.number(),
//     categoryName: z.string(),
//     heuristicMaxSlippageBps: z.number(),
//   })
//   .passthrough()

const swapTypeSchema = z
  .union([
    z.literal('aggregator'),
    z.literal('rfq'),
    z.literal('hashflow'),
    z.string(), // allow unknown values too
  ])
  .transform((val) => {
    if (val === 'aggregator' || val === 'rfq' || val === 'hashflow') {
      return val
    }
    return 'unknown'
  })

export type JupiterOrderSwapType = z.infer<typeof swapTypeSchema>

export const jupiterOrderResponseSchema = z
  .object({
    inputMint: z.string(),
    outputMint: z.string(),
    inAmount: z.string(),
    outAmount: z.string(),
    otherAmountThreshold: z.string(),
    swapMode: z.enum(['ExactIn', 'ExactOut']),
    slippageBps: z.number(),
    priceImpactPct: z.string(),
    routePlan: routePlanSchema,
    feeMint: z.string().nullish(),
    feeBps: z.number(),
    prioritizationFeeLamports: z.number(),
    swapType: swapTypeSchema,
    transaction: z.string().nullish(),
    gasless: z.boolean(),
    requestId: z.string(),
    // totalTime: z.number(),
    taker: z.string().nullish(),
    quoteId: z.string().nullish(),
    maker: z.string().nullish(),
    // expireAt: z.string().nullish(),
    platformFee: platformFeeSchema.nullish(),
    // dynamicSlippageReport: dynamicSlippageReportSchema.nullish(),
    // errorMessage: z.string().nullish(),
  })
  .passthrough()

export type JupiterOrderResponse = Prettify<z.infer<typeof jupiterOrderResponseSchema>>
