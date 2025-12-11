import { z } from 'zod'

// Dynamic Message Schema Placeholder
// eslint-disable-next-line no-restricted-syntax
const DynamicMessageSchema = z.record(z.string(), z.any())
export type EIP712Message = z.infer<typeof DynamicMessageSchema>

// Dynamic Type Definition Schema
export const TypeDefinitionSchema = z
  .object({
    name: z.string(),
    type: z.string(),
  })
  .strict() // Ensure no additional properties

// Dynamic Types Schema
const DynamicTypesSchema = z
  .object({
    EIP712Domain: z.array(TypeDefinitionSchema), // Explicitly define EIP712Domain
  })
  .catchall(z.array(TypeDefinitionSchema)) // Handle additional dynamic types

// EIP-712 Domain Schema
const EIP712DomainSchema = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  chainId: z.union([z.number(), z.bigint(), z.string()]).optional(),
  verifyingContract: z.string().optional(),
  salt: z.string().length(66).optional(), // Assuming hex string (0x + 32 bytes)
})

export type EIP712DomainType = z.infer<typeof EIP712DomainSchema>

// EIP-712 Typed Data Schema
const EIP712TypedDataSchema = z.object({
  domain: EIP712DomainSchema.optional(),
  types: DynamicTypesSchema,
  primaryType: z.string(), // The primary type being used from the types object
  message: DynamicMessageSchema, // The dynamic message structure
})

type EIP712TypedData = z.infer<typeof EIP712TypedDataSchema>

export function isEIP712TypedData(data: unknown): data is EIP712TypedData {
  return EIP712TypedDataSchema.safeParse(data).success
}
