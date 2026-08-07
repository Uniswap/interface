import { permit2Address } from '@uniswap/permit2-sdk'
import { REACTOR_ADDRESS_MAPPING } from '@uniswap/uniswapx-sdk'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedDappChainId } from 'uniswap/src/features/chains/utils'
import { TypeDefinitionSchema } from 'wallet/src/components/dappRequests/types/EIP712Types'
import { z } from 'zod'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

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

/**
 * Without this, any contract can claim `name: 'Permit2'` and inherit the trusted previews while
 * the signature stays bound to its own address. `permit2Address` handles zkSync's differing one.
 */
function isCanonicalPermit2Domain(domain: { chainId: string | number | bigint; verifyingContract: string }): boolean {
  const chainId = toSupportedDappChainId(domain.chainId)
  if (!chainId) {
    return false
  }

  return domain.verifyingContract.toLowerCase() === permit2Address(chainId).toLowerCase()
}

const DomainSchema = z
  .object({
    name: z.literal('Permit2'),
    chainId: z.union([z.number(), z.bigint(), z.string()]),
    verifyingContract: z.string(),
  })
  .refine(isCanonicalPermit2Domain, { message: 'Not the canonical Permit2 verifying contract' })

const Permit2Schema = z.object({
  domain: DomainSchema,
  types: TypesSchema,
  primaryType: z.literal('PermitSingle'),
  message: MessageSchema,
})

type Permit2 = z.infer<typeof Permit2Schema>

/**
 * No authorized chain needed: the domain is pinned to the canonical Permit2 for whatever chain it
 * names, and callers enforce domain-vs-authorized equality at intake.
 */
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

    // The mapping holds the zero address on chains with no V2 Dutch reactor (Base, Unichain, the
    // SDK default set), so a truthiness check alone lets `spender: 0x0` pass as a real reactor.
    if (!uniswapXAddress || uniswapXAddress === ZERO_ADDRESS) {
      return false
    }

    return spender === uniswapXAddress
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
    // z.tuple([T], T) preserves non-empty tuple type [T, ...T[]] from v3's .nonempty()
    // .array().min(1) infers as T[] in v4 — see https://zod.dev/v4/changelog#nonempty
    baseOutputs: z.tuple([BaseOutputSchema], BaseOutputSchema),
    cosigner: z.string(),
    info: z.looseObject({}), // allows any additional fields in info
  }),
})

const DutchOrderSchema = z.object({
  domain: DomainSchema,
  types: DutchOrderTypesSchema,
  message: DutchOrderMessageSchema,
  // The preview replaces the raw view entirely, so only the exact type UniswapX signs qualifies.
  primaryType: z.literal('PermitWitnessTransferFrom'),
})

const UniswapXSwapRequestSchema = DutchOrderSchema.refine(isValidUniswapXSpender, {
  message: 'Invalid UniswapX request',
})

export type UniswapXSwapRequest = z.infer<typeof UniswapXSwapRequestSchema>

/**
 * An allowlist, not a best-effort parser: whatever it accepts gets the trusted preview instead of
 * the raw domain, so every identifying field is pinned to a wallet-owned value.
 *
 * `chainId` is the authorized chain. The domain must match, or a payload could name whichever
 * chain makes its spender look like a real reactor.
 */
export function isUniswapXSwapRequest(data: unknown, chainId: UniverseChainId): data is UniswapXSwapRequest {
  const parsed = UniswapXSwapRequestSchema.safeParse(data)
  if (!parsed.success) {
    return false
  }

  return toSupportedDappChainId(parsed.data.domain.chainId) === chainId
}
