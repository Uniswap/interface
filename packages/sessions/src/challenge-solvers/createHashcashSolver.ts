import { findProof, type HashcashChallenge } from '@universe/sessions/src/challenge-solvers/hashcash/core'
import type { HashcashWorkerChannelFactory } from '@universe/sessions/src/challenge-solvers/hashcash/worker/types'
import type { ChallengeData, ChallengeSolver } from '@universe/sessions/src/challenge-solvers/types'
import type { PerformanceTracker } from '@universe/sessions/src/performance/types'
import { z } from 'zod'

/** Error type for analytics classification */
type HashcashErrorType = 'validation' | 'no_proof' | 'worker_busy' | 'unknown'

/** Base class for hashcash errors with typed errorType for reliable analytics classification */
class HashcashError extends Error {
  readonly errorType: HashcashErrorType

  constructor(message: string, errorType: HashcashErrorType) {
    super(message)
    this.name = 'HashcashError'
    this.errorType = errorType
  }
}

/** Validation errors (parsing, missing data, invalid challenge format) */
class HashcashValidationError extends HashcashError {
  constructor(message: string) {
    super(message, 'validation')
    this.name = 'HashcashValidationError'
  }
}

/** Proof not found within allowed iterations */
class HashcashNoProofError extends HashcashError {
  constructor(message: string) {
    super(message, 'no_proof')
    this.name = 'HashcashNoProofError'
  }
}

/** Worker is busy processing another request */
class HashcashWorkerBusyError extends HashcashError {
  constructor(message: string) {
    super(message, 'worker_busy')
    this.name = 'HashcashWorkerBusyError'
  }
}

/**
 * Analytics data for Hashcash solve attempts.
 * Reported via onSolveCompleted callback.
 */
interface HashcashSolveAnalytics {
  durationMs: number
  success: boolean
  errorType?: 'validation' | 'no_proof' | 'worker_busy' | 'unknown'
  errorMessage?: string
  /** The difficulty level of the challenge (number of leading zero bytes) */
  difficulty: number
  /** Number of hash iterations to find proof (undefined on failure) */
  iterationCount?: number
  /** Whether the worker was used for proof computation */
  usedWorker: boolean
}

/**
 * Context for creating a hashcash solver.
 */
interface CreateHashcashSolverContext {
  /**
   * Required: Performance tracker for timing measurements.
   * Must be injected - no implicit dependency on globalThis.performance.
   */
  performanceTracker: PerformanceTracker
  /**
   * Factory function to create a worker channel.
   * If provided, proof-of-work runs in a Web Worker (non-blocking).
   * If not provided, falls back to main-thread execution (blocking).
   */
  getWorkerChannel?: HashcashWorkerChannelFactory
  /**
   * Callback for analytics when solve completes (success or failure)
   */
  onSolveCompleted?: (data: HashcashSolveAnalytics) => void
}

// Zod schema for hashcash challenge validation
const HashcashChallengeSchema = z.object({
  difficulty: z.number().int().nonnegative(),
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
    throw new HashcashValidationError(`Failed to parse challenge JSON: ${error}`)
  }

  // Validate with Zod
  const result = HashcashChallengeSchema.safeParse(parsedData)
  if (!result.success) {
    // Get unique field paths from errors
    const fieldPaths = new Set(
      result.error.issues.filter((issue) => issue.path.length > 0).map((issue) => issue.path[0]),
    )
    if (fieldPaths.size === 1) {
      // Single field-specific error
      const fieldName = String(Array.from(fieldPaths)[0])
      throw new HashcashValidationError(`Invalid challenge data: ${fieldName}`)
    }
    // General validation error (multiple fields or form-level errors)
    throw new HashcashValidationError('Invalid challenge data')
  }

  return result.data
}

/**
 * Classifies error into analytics error type.
 * Uses instanceof checks for typed errors (preferred), with string matching fallback for external errors.
 */
function classifyError(error: unknown): HashcashSolveAnalytics['errorType'] {
  // Prefer typed error classification via instanceof
  if (error instanceof HashcashError) {
    return error.errorType
  }

  // Fallback to string matching for external or legacy errors
  if (error instanceof Error) {
    if (error.message.includes('parse') || error.message.includes('Invalid challenge')) {
      return 'validation'
    }
    if (error.message.includes('Missing challengeData')) {
      return 'validation'
    }
    if (error.message.includes('Failed to find valid proof')) {
      return 'no_proof'
    }
    if (error.message.includes('busy')) {
      return 'worker_busy'
    }
  }
  return 'unknown'
}

/**
 * Creates a real hashcash challenge solver that performs proof-of-work
 * to solve hashcash challenges from the backend.
 *
 * @param ctx - Required context with performanceTracker and optional getWorkerChannel
 */
function createHashcashSolver(ctx: CreateHashcashSolverContext): ChallengeSolver {
  const usedWorker = !!ctx.getWorkerChannel

  async function solve(challengeData: ChallengeData): Promise<string> {
    const startTime = ctx.performanceTracker.now()
    let difficulty = 0 // Default, will be updated after parsing

    try {
      let challenge: HashcashChallenge

      // Prefer typed challengeData over legacy extra field
      if (challengeData.challengeData?.case === 'hashcash') {
        const typed = challengeData.challengeData.value
        challenge = {
          difficulty: typed.difficulty,
          subject: typed.subject,
          algorithm: typed.algorithm as 'sha256',
          nonce: typed.nonce,
          max_proof_length: typed.maxProofLength,
          verifier: typed.verifier,
        }
      } else {
        // Fallback to legacy extra field
        const challengeDataStr = challengeData.extra?.['challengeData']
        if (!challengeDataStr) {
          throw new HashcashValidationError('Missing challengeData in challenge extra field')
        }
        challenge = parseHashcashChallenge(challengeDataStr)
      }

      difficulty = challenge.difficulty

      const findProofParams = {
        challenge,
        rangeStart: 0,
        rangeSize: challenge.max_proof_length,
      }

      // Use worker if provided, otherwise fall back to main thread
      let proof
      if (ctx.getWorkerChannel) {
        const workerChannel = ctx.getWorkerChannel()
        try {
          proof = await workerChannel.api.findProof(findProofParams)
        } finally {
          workerChannel.terminate()
        }
      } else {
        // Fallback to main-thread execution (still async for Web Crypto)
        proof = await findProof(findProofParams)
      }

      if (!proof) {
        throw new HashcashNoProofError(
          `Failed to find valid proof within allowed range (0-${challenge.max_proof_length}). ` +
            'Challenge may have expired or difficulty may be too high.',
        )
      }

      // Report success
      ctx.onSolveCompleted?.({
        durationMs: ctx.performanceTracker.now() - startTime,
        success: true,
        difficulty,
        iterationCount: proof.attempts,
        usedWorker,
      })

      // Return the solution in the format expected by backend: "${subject}:${nonce}:${counter}"
      return `${challenge.subject}:${challenge.nonce}:${proof.counter}`
    } catch (error) {
      // Report failure
      ctx.onSolveCompleted?.({
        durationMs: ctx.performanceTracker.now() - startTime,
        success: false,
        errorType: classifyError(error),
        errorMessage: error instanceof Error ? error.message : String(error),
        difficulty,
        usedWorker,
      })
      throw error
    }
  }

  return { solve }
}

export {
  createHashcashSolver,
  parseHashcashChallenge,
  HashcashError,
  HashcashValidationError,
  HashcashNoProofError,
  HashcashWorkerBusyError,
}
export type { HashcashSolveAnalytics, CreateHashcashSolverContext }
