import { ChallengeType } from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_pb'
import type { SessionService } from '@universe/sessions/src/session-service/types'

function createNoopSessionService(): SessionService {
  const initSession: SessionService['initSession'] = async () => ({ needChallenge: false, extra: {} })
  const removeSession: SessionService['removeSession'] = async () => {}
  const getSessionState: SessionService['getSessionState'] = async () => null
  const requestChallenge: SessionService['requestChallenge'] = async () => ({
    challengeId: 'noop-challenge-123',
    challengeType: ChallengeType.UNSPECIFIED,
    extra: {},
  })
  const upgradeSession: SessionService['upgradeSession'] = async () => ({ retry: false })

  return {
    initSession,
    requestChallenge,
    upgradeSession,
    removeSession,
    getSessionState,
  }
}

export { createNoopSessionService }
