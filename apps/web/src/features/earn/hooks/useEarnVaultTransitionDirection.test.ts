import { renderHook } from '@testing-library/react'
import { EarnVaultView } from 'uniswap/src/features/earn/hooks/useEarnVaultModalFlow'
import { useEarnVaultTransitionDirection } from '~/features/earn/hooks/useEarnVaultTransitionDirection'

describe(useEarnVaultTransitionDirection, () => {
  it('keeps a back transition sticky across a same-view rerender', () => {
    const { result, rerender } = renderHook(
      ({ view }: { view: EarnVaultView }) => useEarnVaultTransitionDirection(view),
      {
        initialProps: { view: EarnVaultView.DepositReview },
      },
    )

    rerender({ view: EarnVaultView.DepositAmount })
    expect(result.current).toBe('backward')

    rerender({ view: EarnVaultView.DepositAmount })
    expect(result.current).toBe('backward')
  })
})
