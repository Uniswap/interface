import { BigNumberSchema } from 'src/app/features/dappRequests/types/EthersTypes'
import { z } from 'zod'

const UnwrapNFPMCommandSchema = z.object({
  commandName: z.literal('unwrapWETH9'),
  params: z.object({
    amountMinimum: BigNumberSchema,
    recipient: z.string(),
  }),
})

const SweepNFPMCommandSchema = z.object({
  commandName: z.literal('sweepToken'),
  params: z.object({
    amountMinimum: BigNumberSchema,
    recipient: z.string(),
    token: z.string(),
  }),
})

const CollectNFPMCommandSchema = z.object({
  commandName: z.literal('collect'),
  params: z.object({
    amountMinimum: BigNumberSchema,
    recipient: z.string(),
    token: z.string(),
  }),
})

const DecreaseLiquidityNFPMCommandSchema = z.object({
  commandName: z.literal('decreaseLiquidity'),
  params: z.object({
    amount0Min: BigNumberSchema,
    amount1Min: BigNumberSchema,
    deadline: BigNumberSchema,
    liquidity: BigNumberSchema,
    tokenId: BigNumberSchema,
  }),
})

const IncreaseLiquidityNFPMCommandSchema = z.object({
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

const RefundETHNFPMCommandSchema = z.object({
  commandName: z.literal('refundETH'),
})

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
