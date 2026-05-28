import type { TypedChallengeData } from '@universe/sessions/src/session-repository/types'
import type { ChallengeType } from '@universe/sessions/src/session-service/types'

interface ChallengeData {
  challengeId: string
  challengeType: ChallengeType
  /** @deprecated Use challengeData instead */
  extra?: Record<string, string>
  /** Type-safe challenge-specific data (replaces extra) */
  challengeData?: TypedChallengeData
}

interface ChallengeSolver {
  solve(challengeData: ChallengeData): Promise<string>
}

interface ChallengeSolverService {
  getSolver(type: ChallengeType): ChallengeSolver | null
}

/**
 * Script injection options for CSP compliance and customization
 */
interface TurnstileScriptOptions {
  /**
   * Custom nonce for the injected script (for CSP compliance)
   */
  nonce?: string
  /**
   * Whether to set the script as defer
   * @default false (Turnstile requires synchronous loading for ready())
   */
  defer?: boolean
  /**
   * Whether to set the script as async
   * @default false (Turnstile requires synchronous loading for ready())
   */
  async?: boolean
  /**
   * Custom crossOrigin for the injected script
   */
  crossOrigin?: string
  /**
   * Custom ID for the injected script
   * @default "cf-turnstile-script"
   */
  id?: string
  /**
   * Custom name for the onload callback
   * @default "onloadTurnstileCallback"
   */
  onLoadCallbackName?: string
}

export type { ChallengeData, ChallengeSolver, ChallengeSolverService, TurnstileScriptOptions }
