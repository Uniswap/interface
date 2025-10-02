import { z } from 'zod'

export type MessageParsers<T extends string, R extends { [key in T]: { type: key } }> = {
  [key in T]: (message: unknown) => R[key]
}

export function parseMessage<TSchema extends z.ZodTypeAny>(
  message: unknown,
  schema: TSchema,
): z.infer<TSchema> | undefined {
  try {
    // The returned value will be properly typed according to the schema,
    // but this type can be `any` if the schema passed in is defined as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return schema.parse(message)
  } catch (_e) {
    return undefined
  }
}
