import { z } from 'zod'

export const ScantasticParamsSchema = z.object({
  uuid: z
    // issue.input === undefined is the documented v4 pattern — see https://zod.dev/error-customization
    .string({ error: (issue) => (issue.input === undefined ? 'UUID is required' : 'Invalid UUID') })
    .uuid('Invalid UUID'),
  publicKey: z.object(
    {
      alg: z.literal('RSA-OAEP-256', {
        error: (issue) => (issue.input === undefined ? 'Algorithm is required' : 'Invalid algorithm'),
      }),
      kty: z.literal('RSA', {
        error: (issue) => (issue.input === undefined ? 'Key type is required' : 'Invalid key type'),
      }),
      n: z
        .string({ error: (issue) => (issue.input === undefined ? 'Modulus is required' : 'Invalid modulus') })
        .min(1, 'Modulus is required'),
      e: z.literal('AQAB', {
        error: (issue) => (issue.input === undefined ? 'Public exponent is required' : 'Invalid public exponent'),
      }),
    },
    { error: (issue) => (issue.input === undefined ? 'Public key is required' : 'Invalid public key') },
  ),
  vendor: z.string().nullish(),
  model: z.string().nullish(),
  browser: z.string().nullish(),
})
export type ScantasticParams = z.infer<typeof ScantasticParamsSchema>
