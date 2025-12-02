import type { ChallengeType } from '@universe/sessions/src/session-service/types'

interface ChallengeData {
  challengeId: string
  challengeType: ChallengeType
  extra?: Record<string, string>
}

interface ChallengeSolver {
  solve(challengeData: ChallengeData): Promise<string>
}

interface ChallengeSolverService {
  getSolver(type: ChallengeType): ChallengeSolver | null
}

export type { ChallengeData, ChallengeSolver, ChallengeSolverService }
