import { z } from 'zod'

// SCHEMAS
export const MessageSchema = z.object({})

// TYPES
export type Message = z.infer<typeof MessageSchema>
