import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useFeatureFlaggedChainIds } from 'uniswap/src/features/chains/hooks/useFeatureFlaggedChainIds'
import { renderHook } from 'uniswap/src/test/test-utils'
import type { Mock } from 'vitest'

vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...actual,
    useFeatureFlag: vi.fn(),
  }
})

const mockUseFeatureFlag = useFeatureFlag as Mock

function renderWithFlagsOn(flagsOn: FeatureFlags[]): UniverseChainId[] {
  mockUseFeatureFlag.mockImplementation((flag: FeatureFlags) => flagsOn.includes(flag))
  return renderHook(() => useFeatureFlaggedChainIds()).result.current
}

describe(useFeatureFlaggedChainIds, () => {
  it('keeps Blast while DisableBlast is off or not yet loaded', () => {
    expect(renderWithFlagsOn([])).toContain(UniverseChainId.Blast)
  })

  it('removes Blast when DisableBlast is on', () => {
    expect(renderWithFlagsOn([FeatureFlags.DisableBlast])).not.toContain(UniverseChainId.Blast)
  })
})
