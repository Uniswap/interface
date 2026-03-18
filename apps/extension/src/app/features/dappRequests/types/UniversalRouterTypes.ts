import { CommandType } from '@uniswap/universal-router-sdk'
import { FeeAmount as FeeAmountV3 } from '@uniswap/v3-sdk'
import { BigNumberSchema } from 'src/app/features/dappRequests/types/EthersTypes'
import { z } from 'zod'

// SCHEMAS + TYPES
const CommandNameSchema = z.enum(
  Object.keys(CommandType) as [keyof typeof CommandType, ...Array<keyof typeof CommandType>],
)

// TODO: remove this fallback once params are fully typed or we are able to import them from the universal router sdk
const FallbackParamSchema = z.object({
  name: z.string(),
  // eslint-disable-next-line no-restricted-syntax
  value: z.any(),
})

const AmountInParamSchema = z.object({
  name: z.literal('amountIn'),
  value: BigNumberSchema,
})
export type AmountInParam = z.infer<typeof AmountInParamSchema>

const AmountInMaxParamSchema = z.object({
  name: z.literal('amountInMax'),
  value: BigNumberSchema,
})
export type AmountInMaxParam = z.infer<typeof AmountInMaxParamSchema>

const AmountOutMinParamSchema = z.object({
  name: z.literal('amountOutMin'),
  value: BigNumberSchema,
})
export type AmountOutMinParam = z.infer<typeof AmountOutMinParamSchema>

const AmountOutParamSchema = z.object({
  name: z.literal('amountOut'),
  value: BigNumberSchema,
})
export type AmountOutParam = z.infer<typeof AmountOutParamSchema>

const AmountMinParamSchema = z.object({
  name: z.literal('amountMin'),
  value: BigNumberSchema,
})
type AmountMinParam = z.infer<typeof AmountMinParamSchema>

const FeeAmountSchema = z.nativeEnum(FeeAmountV3)

const V3PathParamSchema = z.object({
  name: z.literal('path'),
  value: z.array(
    z.object({
      tokenIn: z.string().refine((val) => val.startsWith('0x'), {
        message: "tokenIn must start with '0x'",
      }),
      tokenOut: z.string().refine((val) => val.startsWith('0x'), {
        message: "tokenOut must start with '0x'",
      }),
      fee: FeeAmountSchema,
    }),
  ),
})

// V4 PARAMS

// Define PoolKey which is used for the exact single swaps
const PoolKeySchema = z.object({
  currency0: z.string().refine((val) => val.startsWith('0x'), {
    message: "currency0 must start with '0x'",
  }),
  currency1: z.string().refine((val) => val.startsWith('0x'), {
    message: "currency1 must start with '0x'",
  }),
  fee: z.number(),
  tickSpacing: z.number(),
  hooks: z.string(),
})

// V4 SWAP_EXACT_IN_SINGLE
const V4SwapExactInSingleSwapSchema = z.object({
  poolKey: PoolKeySchema,
  zeroForOne: z.boolean(),
  amountIn: BigNumberSchema,
  amountOutMinimum: BigNumberSchema,
  sqrtPriceLimitX96: BigNumberSchema,
  hookData: z.string(),
})

export const V4SwapExactInSingleParamSchema = z.object({
  name: z.literal('SWAP_EXACT_IN_SINGLE'),
  value: z.array(
    z.object({
      name: z.literal('swap'),
      value: V4SwapExactInSingleSwapSchema,
    }),
  ),
})

// V4 SWAP_EXACT_OUT_SINGLE
const SwapExactOutSingleSwapSchema = z.object({
  poolKey: PoolKeySchema,
  zeroForOne: z.boolean(),
  amountOut: BigNumberSchema,
  amountInMaximum: BigNumberSchema,
  sqrtPriceLimitX96: BigNumberSchema,
  hookData: z.string(),
})

export const V4SwapExactOutSingleParamSchema = z.object({
  name: z.literal('SWAP_EXACT_OUT_SINGLE'),
  value: z.array(
    z.object({
      name: z.literal('swap'),
      value: SwapExactOutSingleSwapSchema,
    }),
  ),
})

// Define PathKey which is used for exact swaps with multiple hops
const PathKeySchema = z.object({
  intermediateCurrency: z.string().refine((val) => val.startsWith('0x'), {
    message: "intermediateCurrency must start with '0x'",
  }),
  fee: z.number(),
  tickSpacing: z.number(),
  hooks: z.string().refine((val) => val.startsWith('0x'), {
    message: "hooks must start with '0x'",
  }),
  hookData: z.string(),
})

// V4 SWAP_EXACT_IN
const V4SwapExactInSchema = z.object({
  currencyIn: z.string().refine((val) => val.startsWith('0x'), {
    message: "currencyIn must start with '0x'",
  }),
  path: z.array(PathKeySchema),
  amountIn: BigNumberSchema,
  amountOutMinimum: BigNumberSchema,
})

export const V4SwapExactInParamSchema = z.object({
  name: z.literal('SWAP_EXACT_IN'),
  value: z.array(
    z.object({
      name: z.literal('swap'),
      value: V4SwapExactInSchema,
    }),
  ),
})

// V4 SWAP_EXACT_OUT
const V4SwapExactOutSchema = z.object({
  currencyOut: z.string().refine((val) => val.startsWith('0x'), {
    message: "currencyOut must start with '0x'",
  }),
  path: z.array(PathKeySchema),
  amountOut: BigNumberSchema,
  amountInMaximum: BigNumberSchema,
})

export const V4SwapExactOutParamSchema = z.object({
  name: z.literal('SWAP_EXACT_OUT'),
  value: z.array(
    z.object({
      name: z.literal('swap'),
      value: V4SwapExactOutSchema,
    }),
  ),
})

// END V4 PARAMS

const PayerIsUserParamSchema = z.object({
  name: z.literal('payerIsUser'),
  value: z.boolean(),
})

const SettleParamSchema = z.object({
  name: z.literal('SETTLE'),
  value: z.array(
    z.union([
      z.object({
        name: z.literal('currency'),
        value: z.string(),
      }),
      z.object({
        name: z.literal('amount'),
        value: BigNumberSchema,
      }),
      z.object({
        name: z.literal('payerIsUser'),
        value: z.boolean(),
      }),
    ]),
  ),
})
type SettleParam = z.infer<typeof SettleParamSchema>

const TakeParamSchema = z.object({
  name: z.literal('TAKE'),
  value: z.array(
    z.union([
      z.object({
        name: z.literal('currency'),
        value: z.string(),
      }),
      z.object({
        name: z.literal('recipient'),
        value: z.string(),
      }),
      z.object({
        name: z.literal('amount'),
        value: BigNumberSchema,
      }),
    ]),
  ),
})

const ParamSchema = z.union([
  AmountInParamSchema,
  AmountInMaxParamSchema,
  AmountOutParamSchema,
  AmountOutMinParamSchema,
  AmountMinParamSchema,
  V3PathParamSchema,
  PayerIsUserParamSchema,
  SettleParamSchema,
  TakeParamSchema,
  FallbackParamSchema,
])
export type Param = z.infer<typeof ParamSchema>

const FallbackCommandSchema = z.object({
  commandName: CommandNameSchema,
  commandType: z.nativeEnum(CommandType),
  params: z.array(ParamSchema),
})

const V2SwapExactInCommandSchema = z.object({
  commandName: z.literal('V2_SWAP_EXACT_IN'),
  commandType: z.literal(CommandType.V2_SWAP_EXACT_IN),
  params: z.array(ParamSchema),
})

const V2SwapExactOutCommandSchema = z.object({
  commandName: z.literal('V2_SWAP_EXACT_OUT'),
  commandType: z.literal(CommandType.V2_SWAP_EXACT_OUT),
  params: z.array(ParamSchema),
})

const V3SwapExactInCommandSchema = z.object({
  commandName: z.literal('V3_SWAP_EXACT_IN'),
  commandType: z.literal(CommandType.V3_SWAP_EXACT_IN),
  params: z.array(ParamSchema),
})

const V3SwapExactOutCommandSchema = z.object({
  commandName: z.literal('V3_SWAP_EXACT_OUT'),
  commandType: z.literal(CommandType.V3_SWAP_EXACT_OUT),
  params: z.array(ParamSchema),
})

const SweepCommandSchema = z.object({
  commandName: z.literal('SWEEP'),
  commandType: z.literal(CommandType.SWEEP),
  params: z.array(ParamSchema),
})
type SweepCommand = z.infer<typeof SweepCommandSchema>

const UnwrapWethCommandSchema = z.object({
  commandName: z.literal('UNWRAP_WETH'),
  commandType: z.literal(CommandType.UNWRAP_WETH),
  params: z.array(ParamSchema),
})
type UnwrapWethCommand = z.infer<typeof UnwrapWethCommandSchema>

const V4SwapCommandSchema = z.object({
  commandName: z.literal('V4_SWAP'),
  commandType: z.literal(CommandType.V4_SWAP),
  params: z.array(
    z.union([
      V4SwapExactInParamSchema,
      V4SwapExactOutParamSchema,
      V4SwapExactInSingleParamSchema,
      V4SwapExactOutSingleParamSchema,
      SettleParamSchema,
      TakeParamSchema,
    ]),
  ),
})

const UniversalRouterSwapCommandSchema = z.union([
  V2SwapExactInCommandSchema,
  V2SwapExactOutCommandSchema,
  V3SwapExactInCommandSchema,
  V3SwapExactOutCommandSchema,
  V4SwapCommandSchema,
])
type UniversalRouterSwapCommand = z.infer<typeof UniversalRouterSwapCommandSchema>

const UniversalRouterCommandSchema = z.union([
  FallbackCommandSchema,
  V2SwapExactInCommandSchema,
  V2SwapExactOutCommandSchema,
  V3SwapExactInCommandSchema,
  V3SwapExactOutCommandSchema,
  V4SwapCommandSchema,
  SweepCommandSchema,
  UnwrapWethCommandSchema,
])
export type UniversalRouterCommand = z.infer<typeof UniversalRouterCommandSchema>

export const UniversalRouterCallSchema = z.object({
  commands: z.array(UniversalRouterCommandSchema),
})
export type UniversalRouterCall = z.infer<typeof UniversalRouterCallSchema>

// VALIDATORS + UTILS
export function isURCommandASwap(command: UniversalRouterCommand): command is UniversalRouterSwapCommand {
  return UniversalRouterSwapCommandSchema.safeParse(command).success
}

export function isUrCommandSweep(command: UniversalRouterCommand): command is SweepCommand {
  return SweepCommandSchema.safeParse(command).success
}

export function isUrCommandUnwrapWeth(command: UniversalRouterCommand): command is UnwrapWethCommand {
  return UnwrapWethCommandSchema.safeParse(command).success
}

export function isAmountInParam(param: Param): param is AmountInParam {
  return AmountInParamSchema.safeParse(param).success
}

export function isAmountInMaxParam(param: Param): param is AmountInMaxParam {
  return AmountInMaxParamSchema.safeParse(param).success
}

export function isAmountOutMinParam(param: Param): param is AmountOutMinParam {
  return AmountOutMinParamSchema.safeParse(param).success
}

export function isAmountOutParam(param: Param): param is AmountOutParam {
  return AmountOutParamSchema.safeParse(param).success
}

export function isAmountMinParam(param: Param): param is AmountMinParam {
  return AmountMinParamSchema.safeParse(param).success
}

export function isSettleParam(param: Param): param is SettleParam {
  return SettleParamSchema.safeParse(param).success
}
