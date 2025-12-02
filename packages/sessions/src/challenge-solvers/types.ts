import type { BotDetectionType } from '@universe/sessions/src/session-service/types'

interface ChallengeData {
  challengeId: string
  botDetectionType: BotDetectionType
  extra?: Record<string, string>
}

interface ChallengeSolver {
  solve(challengeData: ChallengeData): Promise<string>
}

interface ChallengeSolverService {
  getSolver(type: BotDetectionType): ChallengeSolver | null
}

export type { ChallengeData, ChallengeSolver, ChallengeSolverService }
