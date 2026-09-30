import { getIsHashcashSolverEnabled, waitForStatsigReady } from '@universe/gating'
import { type ChallengeData, type ChallengeSolver, ChallengeType } from '@universe/sessions'
import { createStatsigGatedHashcashSolver } from 'src/app/features/sessions/createStatsigGatedHashcashSolver'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getIsHashcashSolverEnabled: vi.fn(),
  waitForStatsigReady: vi.fn(),
}))

const CHALLENGE: ChallengeData = { challengeId: 'challenge-1', challengeType: ChallengeType.HASHCASH }

function createSolver(solution: string): ChallengeSolver {
  return { solve: vi.fn(async () => solution) }
}

describe('createStatsigGatedHashcashSolver', () => {
  let realSolver: ChallengeSolver
  let mockSolver: ChallengeSolver
  let gatedSolver: ChallengeSolver

  beforeEach(() => {
    vi.mocked(waitForStatsigReady).mockResolvedValue(undefined)
    realSolver = createSolver('real')
    mockSolver = createSolver('mock')
    gatedSolver = createStatsigGatedHashcashSolver({ realSolver, mockSolver })
  })

  it('uses the real solver when the flag is enabled', async () => {
    vi.mocked(getIsHashcashSolverEnabled).mockReturnValue(true)

    await expect(gatedSolver.solve(CHALLENGE)).resolves.toBe('real')
    expect(realSolver.solve).toHaveBeenCalledWith(CHALLENGE)
    expect(mockSolver.solve).not.toHaveBeenCalled()
  })

  it('uses the mock solver when the flag is disabled', async () => {
    vi.mocked(getIsHashcashSolverEnabled).mockReturnValue(false)

    await expect(gatedSolver.solve(CHALLENGE)).resolves.toBe('mock')
    expect(mockSolver.solve).toHaveBeenCalledWith(CHALLENGE)
    expect(realSolver.solve).not.toHaveBeenCalled()
  })

  it('reads the flag only after Statsig is ready', async () => {
    let resolveReady: () => void = () => undefined
    vi.mocked(waitForStatsigReady).mockReturnValue(
      new Promise<void>((resolve) => {
        resolveReady = resolve
      }),
    )
    vi.mocked(getIsHashcashSolverEnabled).mockReturnValue(true)

    const pending = gatedSolver.solve(CHALLENGE)
    await Promise.resolve()
    expect(getIsHashcashSolverEnabled).not.toHaveBeenCalled()

    resolveReady()
    await expect(pending).resolves.toBe('real')
    expect(getIsHashcashSolverEnabled).toHaveBeenCalledTimes(1)
  })
})
