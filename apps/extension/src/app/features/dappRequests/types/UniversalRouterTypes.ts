import { FeeAmount as FeeAmountV3 } from '@uniswap/v3-sdk'
import { BigNumberSchema } from 'src/app/features/dappRequests/types/EthersTypes'
import { z } from 'zod'

// ENUMS

// TODO: import from UR-sdk
export enum CommandType {
  V3SwapExactIn = 0x00,
  V3SwapExactOut = 0x01,
  Permit2TransferFrom = 0x02,
  Permit2PermitBatch = 0x03,
  SWEEP = 0x04,
  TRANSFER = 0x05,
  PayPortion = 0x06,

  V2SwapExactIn = 0x08,
  V2SwapExactOut = 0x09,
  Permit2Permit = 0x0a,
  WrapEth = 0x0b,
  UnwrapWeth = 0x0c,
  Permit2TransferFromBatch = 0x0d,
  BalanceCheckErc20 = 0x0e,

  // NFT-related command types
  SEAPORT = 0x10,
  LooksRare721 = 0x11,
  NFTX = 0x12,
  CRYPTOPUNKS = 0x13,
  LooksRare1155 = 0x14,
  OwnerCheck721 = 0x15,
  OwnerCheck1155 = 0x16,
  SweepErc721 = 0x17,

  X2y2721 = 0x18,
  SUDOSWAP = 0x19,
  NFT20 = 0x1a,
  X2y21155 = 0x1b,
  FOUNDATION = 0x1c,
  SweepErc1155 = 0x1d,
  ElementMarket = 0x1e,

  ExecuteSubPlan = 0x20,
  Seaportv14 = 0x21,
  ApproveErc20 = 0x22,
}

export enum Subparser {
  V3PathExactIn,
  V3PathExactOut,
}

const PERMIT_STRUCT =
  '((address token,uint160 amount,uint48 expiration,uint48 nonce) details,address spender,uint256 sigDeadline)'

const PERMIT_BATCH_STRUCT =
  '((address token,uint160 amount,uint48 expiration,uint48 nonce)[] details,address spender,uint256 sigDeadline)'

const PERMIT2_TRANSFER_FROM_STRUCT = '(address from,address to,uint160 amount,address token)'
const PERMIT2_TRANSFER_FROM_BATCH_STRUCT = PERMIT2_TRANSFER_FROM_STRUCT + '[]'

export const ABI_DEFINITION: { readonly [key in CommandType]: readonly ParamType[] } = {
  // Batch Reverts
  [CommandType.ExecuteSubPlan]: [
    { name: 'commands', type: 'bytes' },
    { name: 'inputs', type: 'bytes[]' },
  ],

  // Permit2 Actions
  [CommandType.Permit2Permit]: [
    { name: 'permit', type: PERMIT_STRUCT },
    { name: 'signature', type: 'bytes' },
  ],
  [CommandType.Permit2PermitBatch]: [
    { name: 'permit', type: PERMIT_BATCH_STRUCT },
    { name: 'signature', type: 'bytes' },
  ],
  [CommandType.Permit2TransferFrom]: [
    { name: 'token', type: 'address' },
    { name: 'recipient', type: 'address' },
    { name: 'amount', type: 'uint160' },
  ],
  [CommandType.Permit2TransferFromBatch]: [
    {
      name: 'transferFrom',
      type: PERMIT2_TRANSFER_FROM_BATCH_STRUCT,
    },
  ],

  // Uniswap Actions
  [CommandType.V3SwapExactIn]: [
    { name: 'recipient', type: 'address' },
    { name: 'amountIn', type: 'uint256' },
    { name: 'amountOutMin', type: 'uint256' },
    { name: 'path', subparser: Subparser.V3PathExactIn, type: 'bytes' },
    { name: 'payerIsUser', type: 'bool' },
  ],
  [CommandType.V3SwapExactOut]: [
    { name: 'recipient', type: 'address' },
    { name: 'amountOut', type: 'uint256' },
    { name: 'amountInMax', type: 'uint256' },
    { name: 'path', subparser: Subparser.V3PathExactOut, type: 'bytes' },
    { name: 'payerIsUser', type: 'bool' },
  ],
  [CommandType.V2SwapExactIn]: [
    { name: 'recipient', type: 'address' },
    { name: 'amountIn', type: 'uint256' },
    { name: 'amountOutMin', type: 'uint256' },
    { name: 'path', type: 'address[]' },
    { name: 'payerIsUser', type: 'bool' },
  ],
  [CommandType.V2SwapExactOut]: [
    { name: 'recipient', type: 'address' },
    { name: 'amountOut', type: 'uint256' },
    { name: 'amountInMax', type: 'uint256' },
    { name: 'path', type: 'address[]' },
    { name: 'payerIsUser', type: 'bool' },
  ],

  // Token Actions and Checks
  [CommandType.WrapEth]: [
    { name: 'recipient', type: 'address' },
    { name: 'amountMin', type: 'uint256' },
  ],
  [CommandType.UnwrapWeth]: [
    { name: 'recipient', type: 'address' },
    { name: 'amountMin', type: 'uint256' },
  ],
  [CommandType.SWEEP]: [
    { name: 'token', type: 'address' },
    { name: 'recipient', type: 'address' },
    { name: 'amountMin', type: 'uint256' },
  ],
  [CommandType.SweepErc721]: [
    { name: 'token', type: 'address' },
    { name: 'recipient', type: 'address' },
    { name: 'id', type: 'uint256' },
  ],
  [CommandType.SweepErc1155]: [
    { name: 'token', type: 'address' },
    { name: 'recipient', type: 'address' },
    { name: 'id', type: 'uint256' },
    { name: 'amount', type: 'uint256' },
  ],
  [CommandType.TRANSFER]: [
    { name: 'token', type: 'address' },
    { name: 'recipient', type: 'address' },
    { name: 'value', type: 'uint256' },
  ],
  [CommandType.PayPortion]: [
    { name: 'token', type: 'address' },
    { name: 'recipient', type: 'address' },
    { name: 'bips', type: 'uint256' },
  ],
  [CommandType.BalanceCheckErc20]: [
    { name: 'owner', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'minBalance', type: 'uint256' },
  ],
  [CommandType.OwnerCheck721]: [
    { name: 'owner', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'id', type: 'uint256' },
  ],
  [CommandType.OwnerCheck1155]: [
    { name: 'owner', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'id', type: 'uint256' },
    { name: 'minBalance', type: 'uint256' },
  ],
  [CommandType.ApproveErc20]: [
    { name: 'token', type: 'address' },
    { name: 'spenderId', type: 'uint256' },
  ],

  // NFT Markets
  [CommandType.SEAPORT]: [
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
  ],
  [CommandType.Seaportv14]: [
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
  ],
  [CommandType.NFTX]: [
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
  ],
  [CommandType.LooksRare721]: [
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
    { name: 'recipient', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'id', type: 'uint256' },
  ],
  [CommandType.LooksRare1155]: [
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
    { name: 'recipient', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'id', type: 'uint256' },
  ],
  [CommandType.X2y2721]: [
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
    { name: 'recipient', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'id', type: 'uint256' },
  ],
  [CommandType.X2y21155]: [
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
    { name: 'recipient', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'id', type: 'uint256' },
  ],
  [CommandType.FOUNDATION]: [
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
    { name: 'recipient', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'id', type: 'uint256' },
  ],
  [CommandType.SUDOSWAP]: [
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
  ],
  [CommandType.NFT20]: [
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
  ],
  [CommandType.CRYPTOPUNKS]: [
    { name: 'punkId', type: 'uint256' },
    { name: 'recipient', type: 'address' },
    { name: 'value', type: 'uint256' },
  ],
  [CommandType.ElementMarket]: [
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
  ],
}

// SCHEMAS + TYPES
export const SubparserSchema = z.nativeEnum(Subparser)

export const ParamTypeSchema = z.object({
  name: z.string(),
  type: z.string(),
  subparser: SubparserSchema.optional(),
})
export type ParamType = z.infer<typeof ParamTypeSchema>

export const CommandNameSchema = z.enum(
  Object.keys(CommandType) as [keyof typeof CommandType, ...Array<keyof typeof CommandType>]
)
export type CommandName = z.infer<typeof CommandNameSchema>

// TODO: remove this fallback once params are fully typed or we are able to import them from the universal router sdk
const FallbackParamSchema = z.object({
  name: z.string(),
  // eslint-disable-next-line no-restricted-syntax
  value: z.any(),
})
export type FallbackParam = z.infer<typeof FallbackParamSchema>

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

const FeeAmountSchema = z.nativeEnum(FeeAmountV3)
export type FeeAmount = z.infer<typeof FeeAmountSchema>

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
    })
  ),
})
export type V3Path = z.infer<typeof V3PathParamSchema>

const PayerIsUserParamSchema = z.object({
  name: z.literal('payerIsUser'),
  value: z.boolean(),
})
export type PayerIsUserParam = z.infer<typeof PayerIsUserParamSchema>

export const ParamSchema = z.union([
  AmountInParamSchema,
  AmountInMaxParamSchema,
  AmountOutParamSchema,
  AmountOutMinParamSchema,
  V3PathParamSchema,
  PayerIsUserParamSchema,
  FallbackParamSchema,
])
export type Param = z.infer<typeof ParamSchema>

export const FallbackCommandSchema = z.object({
  commandName: CommandNameSchema,
  commandType: z.nativeEnum(CommandType),
  params: z.array(ParamSchema),
})
export type FallbackCommand = z.infer<typeof FallbackCommandSchema>

const V2SwapExactInCommandSchema = z.object({
  commandName: z.literal('V2SwapExactIn'),
  commandType: z.literal(CommandType.V2SwapExactIn),
  params: z.array(ParamSchema),
})
export type V2SwapExactInCommand = z.infer<typeof V2SwapExactInCommandSchema>

const V2SwapExactOutCommandSchema = z.object({
  commandName: z.literal('V2SwapExactOut'),
  commandType: z.literal(CommandType.V2SwapExactOut),
  params: z.array(ParamSchema),
})
export type V2SwapExactOutCommand = z.infer<typeof V2SwapExactOutCommandSchema>

const V3SwapExactInCommandSchema = z.object({
  commandName: z.literal('V3SwapExactIn'),
  commandType: z.literal(CommandType.V3SwapExactIn),
  params: z.array(ParamSchema),
})
export type V3SwapExactInCommand = z.infer<typeof V3SwapExactInCommandSchema>

const V3SwapExactOutCommandSchema = z.object({
  commandName: z.literal('V3SwapExactOut'),
  commandType: z.literal(CommandType.V3SwapExactOut),
  params: z.array(ParamSchema),
})
export type V3SwapExactOutCommand = z.infer<typeof V3SwapExactOutCommandSchema>

export const UniversalRouterSwapCommandSchema = z.union([
  V2SwapExactInCommandSchema,
  V2SwapExactOutCommandSchema,
  V3SwapExactInCommandSchema,
  V3SwapExactOutCommandSchema,
])
export type UniversalRouterSwapCommand = z.infer<typeof UniversalRouterSwapCommandSchema>

const UniversalRouterCommandSchema = z.union([
  FallbackCommandSchema,
  V2SwapExactInCommandSchema,
  V2SwapExactOutCommandSchema,
  V3SwapExactInCommandSchema,
  V3SwapExactOutCommandSchema,
])
export type UniversalRouterCommand = z.infer<typeof UniversalRouterCommandSchema>

export const UniversalRouterCallSchema = z.object({
  commands: z.array(UniversalRouterCommandSchema),
})
export type UniversalRouterCall = z.infer<typeof UniversalRouterCallSchema>

// VALIDATORS + UTILS
export function isURCommandASwap(
  command: UniversalRouterCommand
): command is UniversalRouterSwapCommand {
  return UniversalRouterSwapCommandSchema.safeParse(command).success
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
