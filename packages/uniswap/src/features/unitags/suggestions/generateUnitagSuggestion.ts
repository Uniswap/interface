import {
  UNITAG_SUGGESTION_ADJECTIVES,
  UNITAG_SUGGESTION_NOUNS,
} from 'uniswap/src/features/unitags/suggestions/unitagSuggestionDictionary'
import { pickRandom } from 'utilities/src/primitives/array'

// Output contract (see the username generator spec). Generated names:
// - are lowercase a-z0-9 with no separators (guaranteed by the pre-vetted pools + appended digits),
// - target 8-16 chars, hard max 20, min claimable 5,
// - never start with a digit (digits are only ever appended).
const MIN_TARGET_LENGTH = 8
const MAX_TARGET_LENGTH = 16
const MIN_CLAIMABLE_LENGTH = 5
const HARD_MAX_LENGTH = 20
const MAX_TARGET_RETRIES = 8
const MAX_APPENDED_DIGITS = 3

export type RandomFn = () => number

export interface GenerateUnitagOptions {
  /** Injectable randomness source; defaults to Math.random. */
  random?: RandomFn
  /**
   * Allow the `noun+noun` overflow pattern in addition to the default `adjective+noun`.
   * Used to widen the digit-free namespace when clean `adjective+noun` combos are scarce.
   */
  allowNounNoun?: boolean
}

function buildBaseCombo({ random, allowNounNoun }: { random: RandomFn; allowNounNoun: boolean }): string {
  const useNounNoun = allowNounNoun && random() < 0.5
  const first = useNounNoun
    ? pickRandom(UNITAG_SUGGESTION_NOUNS, random)
    : pickRandom(UNITAG_SUGGESTION_ADJECTIVES, random)
  const second = pickRandom(UNITAG_SUGGESTION_NOUNS, random)
  return `${first}${second}`
}

/**
 * Generates a single username candidate from the curated pools. Does NOT check availability.
 *
 * Prefers the 8-16 char target window but always returns a contract-valid candidate
 * (5-20 chars, lowercase a-z, never starting with a digit).
 */
export function generateUnitagCandidate(options: GenerateUnitagOptions = {}): string {
  const random = options.random ?? Math.random
  const allowNounNoun = options.allowNounNoun ?? false

  let fallback: string | undefined
  for (let attempt = 0; attempt < MAX_TARGET_RETRIES; attempt++) {
    const combo = buildBaseCombo({ random, allowNounNoun })
    if (combo.length >= MIN_TARGET_LENGTH && combo.length <= MAX_TARGET_LENGTH) {
      return combo
    }
    if (!fallback && combo.length >= MIN_CLAIMABLE_LENGTH && combo.length <= HARD_MAX_LENGTH) {
      fallback = combo
    }
  }
  return fallback ?? buildBaseCombo({ random, allowNounNoun })
}

/**
 * Appends 1-3 random digits to a base combo (never prefixed), respecting the 20 char hard max.
 * Used as a collision-escalation fallback when clean combos are unavailable. Returns the base
 * unchanged when there is no room left for digits.
 */
export function appendRandomDigits(base: string, options: { random?: RandomFn; digits?: number } = {}): string {
  const random = options.random ?? Math.random
  const requested = Math.min(Math.max(options.digits ?? 1, 1), MAX_APPENDED_DIGITS)
  const room = HARD_MAX_LENGTH - base.length
  const count = Math.min(requested, room)
  if (count <= 0) {
    return base
  }
  let suffix = ''
  for (let i = 0; i < count; i++) {
    suffix += Math.floor(random() * 10).toString()
  }
  return `${base}${suffix}`
}
