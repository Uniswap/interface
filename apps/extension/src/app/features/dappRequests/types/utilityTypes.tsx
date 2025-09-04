import { z } from 'zod'

export const HexadecimalNumberSchema = z.union([z.number(), z.string()]).transform((value, ctx): number => {
  if (typeof value === 'number') {
    return value
  }
  const possibleNumber = Number(value)
  if (!isNaN(possibleNumber)) {
    return possibleNumber
  }
  ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Not a hexadecimal number' })
  return z.NEVER
})
