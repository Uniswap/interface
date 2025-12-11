import { REACTOR_ADDRESS_MAPPING } from '@uniswap/uniswapx-sdk'
import { TypeDefinitionSchema } from 'wallet/src/components/dappRequests/types/EIP712Types'
import { z } from 'zod'

const MessageSchema = z.object({
  details: z.object({
    token: z.string(),
    amount: z.string(),
    expiration: z.string(),
    nonce: z.string(),
  }),
  spender: z.string(),
  sigDeadline: z.string(),
})

const TypesSchema = z
  .object({
    EIP712Domain: z.array(TypeDefinitionSchema),
    PermitDetails: z.array(TypeDefinitionSchema),
    PermitSingle: z.array(TypeDefinitionSchema),
  })
  .catchall(z.array(TypeDefinitionSchema))

const DomainSchema = z.object({
  name: z.literal('Permit2'),
  chainId: z.union([z.number(), z.bigint(), z.string()]),
  verifyingContract: z.string(),
})

const Permit2Schema = z.object({
  domain: DomainSchema,
  types: TypesSchema,
  primaryType: z.literal('PermitSingle'),
  message: MessageSchema,
})

type Permit2 = z.infer<typeof Permit2Schema>

export function isPermit2(data: unknown): data is Permit2 {
  return Permit2Schema.safeParse(data).success
}

function isValidUniswapXSpender(data: {
  message: { spender: string }
  domain: { chainId: string | number | bigint }
}): boolean {
  try {
    const { message, domain } = data
    const spender = message.spender.toLowerCase()
    const uniswapXAddress = REACTOR_ADDRESS_MAPPING[Number(domain.chainId)]?.Dutch_V2?.toLowerCase()
    return Boolean(uniswapXAddress && spender === uniswapXAddress)
  } catch {
    return false
  }
}

const DutchOrderTypesSchema = z
  .object({
    DutchOutput: z.array(TypeDefinitionSchema),
    EIP712Domain: z.array(TypeDefinitionSchema),
    OrderInfo: z.array(TypeDefinitionSchema),
    PermitWitnessTransferFrom: z.array(TypeDefinitionSchema),
    TokenPermissions: z.array(TypeDefinitionSchema),
    V2DutchOrder: z.array(TypeDefinitionSchema),
  })
  .catchall(z.array(TypeDefinitionSchema))

const BaseOutputSchema = z.object({
  token: z.string(),
  startAmount: z.string(),
  endAmount: z.string(),
  recipient: z.string(),
})

const DutchOrderMessageSchema = z.object({
  deadline: z.string(),
  nonce: z.string(),
  permitted: z.object({
    token: z.string(),
    amount: z.string(),
  }),
  spender: z.string(),
  witness: z.object({
    baseInputEndAmount: z.string(),
    baseInputStartAmount: z.string(),
    baseInputToken: z.string(),
    baseOutputs: z.array(BaseOutputSchema).nonempty(),
    cosigner: z.string(),
    info: z.object({}).passthrough(), // allows any additional fields in info
  }),
})

const DutchOrderSchema = z.object({
  domain: DomainSchema,
  types: DutchOrderTypesSchema,
  message: DutchOrderMessageSchema,
  primaryType: z.string(),
})

const UniswapXSwapRequestSchema = DutchOrderSchema.refine(isValidUniswapXSpender, {
  message: 'Invalid UniswapX request',
})

export type UniswapXSwapRequest = z.infer<typeof UniswapXSwapRequestSchema>

export function isUniswapXSwapRequest(data: unknown): data is UniswapXSwapRequest {
  return UniswapXSwapRequestSchema.safeParse(data).success
}
