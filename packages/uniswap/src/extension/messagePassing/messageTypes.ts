import { z } from 'zod'

// SCHEMAS
// Using looseObject to allow any additional properties (required for message inheritance)
export const MessageSchema = z.looseObject({})

// TYPES
export type Message = z.infer<typeof MessageSchema>
