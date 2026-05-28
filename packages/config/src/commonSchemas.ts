import { z } from 'zod'

/** Parses 'true' (case-insensitive) to boolean true, anything else (including undefined) to false */
export const boolFromString = z.unknown().transform((v): boolean => typeof v === 'string' && v.toLowerCase() === 'true')

/** Parses '1' string to boolean true, anything else to false (for VERCEL env var) */
export const boolFromOne = z.unknown().transform((v): boolean => v === '1')

/** Returns true if the value is any defined, non-empty string (e.g. test runner worker IDs) */
export const boolIfDefined = z.unknown().transform((v): boolean => typeof v === 'string' && v.length > 0)

/** String that defaults to empty when missing */
export const optionalString = z.string().default('')
