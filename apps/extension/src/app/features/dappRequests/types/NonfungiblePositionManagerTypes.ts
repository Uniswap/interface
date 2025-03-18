import { BigNumberSchema } from 'src/app/features/dappRequests/types/EthersTypes'
import { z } from 'zod'

export const UnwrapNFPMCommandSchema = z.object({
  commandName: z.literal('unwrapWETH9'),
  params: z.object({
    amountMinimum: BigNumberSchema,
    recipient: z.string(),
  }),
})
export type UnwrapNFPMCommand = z.infer<typeof UnwrapNFPMCommandSchema>

export const SweepNFPMCommandSchema = z.object({
  commandName: z.literal('sweepToken'),
  params: z.object({
    amountMinimum: BigNumberSchema,
    recipient: z.string(),
    token: z.string(),
  }),
})
export type SweepNFPMCommand = z.infer<typeof SweepNFPMCommandSchema>

export const CollectNFPMCommandSchema = z.object({
  commandName: z.literal('collect'),
  params: z.object({
    amountMinimum: BigNumberSchema,
    recipient: z.string(),
    token: z.string(),
  }),
})
export type CollectNFPMCommand = z.infer<typeof CollectNFPMCommandSchema>

export const DecreaseLiquidityNFPMCommandSchema = z.object({
  commandName: z.literal('decreaseLiquidity'),
  params: z.object({
    amount0Min: BigNumberSchema,
    amount1Min: BigNumberSchema,
    deadline: BigNumberSchema,
    liquidity: BigNumberSchema,
    tokenId: BigNumberSchema,
  }),
})
export type DecreaseLiquidityNFPMCommand = z.infer<typeof DecreaseLiquidityNFPMCommandSchema>

export const IncreaseLiquidityNFPMCommandSchema = z.object({
  commandName: z.literal('increaseLiquidity'),
  params: z.object({
    amount0Desired: BigNumberSchema,
    amount0Min: BigNumberSchema,
    amount1Desired: BigNumberSchema,
    amount1Min: BigNumberSchema,
    deadline: BigNumberSchema,
    tokenId: BigNumberSchema,
  }),
})
export type IncreaseLiquidityNFPMCommand = z.infer<typeof IncreaseLiquidityNFPMCommandSchema>

export const RefundETHNFPMCommandSchema = z.object({
  commandName: z.literal('refundETH'),
})
export type RefundETHNFPMCommand = z.infer<typeof RefundETHNFPMCommandSchema>

export const NfpmCommandSchema = z.union([
  UnwrapNFPMCommandSchema,
  SweepNFPMCommandSchema,
  CollectNFPMCommandSchema,
  DecreaseLiquidityNFPMCommandSchema,
  IncreaseLiquidityNFPMCommandSchema,
  RefundETHNFPMCommandSchema,
])
export type NFPMCommand = z.infer<typeof NfpmCommandSchema>

export const NonfungiblePositionManagerCallSchema = z.object({
  commands: z.array(NfpmCommandSchema),
})
export type NonfungiblePositionManagerCall = z.infer<typeof NonfungiblePositionManagerCallSchema>
