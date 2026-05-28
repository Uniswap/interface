import { z } from 'zod'

/** A record of raw config values, typically from process.env.X */
export type ConfigValues = Record<string, unknown>

/** A zod object schema that defines the shape and validation for config values */
export type ConfigSchema = z.ZodObject<Record<string, z.ZodTypeAny>>
