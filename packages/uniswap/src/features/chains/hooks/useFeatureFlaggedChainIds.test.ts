import { UniverseChainId } from '@universe/chains'
import { createGetFeatureFlaggedChainIds } from 'uniswap/src/features/chains/hooks/useFeatureFlaggedChainIds'

describe(createGetFeatureFlaggedChainIds, () => {
  it('excludes Elysium while its rollout flag is off', () => {
    const chainIds = createGetFeatureFlaggedChainIds(() => false)()

    expect(chainIds).toContain(UniverseChainId.Mainnet)
    expect(chainIds).not.toContain(UniverseChainId.Elysium)
  })

  it('includes Elysium once its rollout flag is on', () => {
    expect(createGetFeatureFlaggedChainIds(() => true)()).toContain(UniverseChainId.Elysium)
  })
})
