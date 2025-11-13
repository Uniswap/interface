import { findProof, type HashcashChallenge } from '@universe/sessions/src/challenge-solvers/hashcash/core'
import type { ChallengeData, ChallengeSolver } from '@universe/sessions/src/challenge-solvers/types'
import { z } from 'zod'

// Zod schema for hashcash challenge validation
const HashcashChallengeSchema = z.object({
  difficulty: z.number().int().nonnegative(),
  expires_at: z.number(),
  subject: z.string().min(1),
  algorithm: z.literal('sha256'),
  nonce: z.string().min(1),
  max_proof_length: z.number().int().positive().default(1000000),
  verifier: z.string().optional(),
})

/**
 * Parses and validates hashcash challenge data from the backend.
 * @param challengeDataStr - JSON string containing challenge data
 * @returns Parsed and validated HashcashChallenge
 * @throws {Error} If challenge data is invalid or missing required fields
 */
function parseHashcashChallenge(challengeDataStr: string): HashcashChallenge {
  let parsedData: unknown
  try {
    parsedData = JSON.parse(challengeDataStr)
  } catch (error) {
    throw new Error(`Failed to parse challenge JSON: ${error}`)
  }

  // Validate with Zod
  const result = HashcashChallengeSchema.safeParse(parsedData)
  if (!result.success) {
    const flattened = result.error.flatten()
    // Check if there's exactly one field with errors
    const fieldErrorKeys = Object.keys(flattened.fieldErrors).filter((key) => {
      const errors = flattened.fieldErrors[key as keyof typeof flattened.fieldErrors]
      return errors && errors.length > 0
    })
    if (fieldErrorKeys.length === 1) {
      // Single field-specific error
      throw new Error(`Invalid challenge data: ${fieldErrorKeys[0]}`)
    }
    // General validation error (multiple fields or form-level errors)
    throw new Error('Invalid challenge data')
  }

  return result.data
}

/**
 * Creates a real hashcash challenge solver that performs proof-of-work
 * to solve hashcash challenges from the backend.
 */
function createHashcashSolver(): ChallengeSolver {
  async function solve(challengeData: ChallengeData): Promise<string> {
    // Extract challenge data from extra field
    const challengeDataStr = challengeData.extra?.challengeData
    if (!challengeDataStr) {
      throw new Error('Missing challengeData in challenge extra field')
    }

    // Parse and validate the challenge data
    const challenge = parseHashcashChallenge(challengeDataStr)

    // Check if challenge has already expired
    if (Date.now() >= challenge.expires_at) {
      throw new Error('Challenge has already expired')
    }

    // Find proof-of-work solution
    const proof = findProof({
      challenge,
      rangeStart: 0,
      rangeSize: challenge.max_proof_length,
    })

    if (!proof) {
      throw new Error(
        `Failed to find valid proof within allowed range (0-${challenge.max_proof_length}). ` +
          'Challenge may have expired or difficulty may be too high.',
      )
    }

    // Return the solution in the format expected by backend: "${subject}:${nonce}:${counter}"
    return `${challenge.subject}:${challenge.nonce}:${proof.counter}`
  }

  return { solve }
}

export { createHashcashSolver, parseHashcashChallenge }
