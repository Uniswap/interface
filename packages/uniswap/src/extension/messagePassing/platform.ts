import { z } from 'zod'

export type MessageParsers<T extends string, R extends { [key in T]: { type: key } }> = {
  [key in T]: (message: unknown) => R[key]
}

export function parseMessage<TSchema extends z.ZodType>(
  message: unknown,
  schema: TSchema,
): z.infer<TSchema> | undefined {
  try {
    return schema.parse(message)
  } catch (_e) {
    return undefined
  }
}
