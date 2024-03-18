import { z } from 'zod'

export const ScantasticParamsSchema = z.object({
  uuid: z.string({ required_error: 'UUID is required' }).uuid('Invalid UUID'),
  publicKey: z.object(
    {
      alg: z.literal('RSA-OAEP-256', {
        required_error: 'Algorithm is required',
        invalid_type_error: 'Invalid algorithm',
      }),
      kty: z.literal('RSA', {
        required_error: 'Key type is required',
        invalid_type_error: 'Invalid key type',
      }),
      n: z.string({ required_error: 'Modulus is required' }).min(1, 'Modulus is required'),
      e: z.literal('AQAB', {
        required_error: 'Public exponent is required',
        invalid_type_error: 'Invalid public exponent',
      }),
    },
    { required_error: 'Public key is required' }
  ),
  vendor: z.string().nullable(),
  model: z.string().nullable(),
  browser: z.string().nullable(),
})
export type ScantasticParams = z.infer<typeof ScantasticParamsSchema>
