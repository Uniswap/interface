import { fireEvent } from '@testing-library/react'
import { TestID } from '@universe/test'
import { describe, expect, it, vi } from 'vitest'
import { MarginFormMarketsState } from '~/pages/Swap/Margin/components/MarginFormMarketsState'
import { render } from '~/test-utils/render'

describe('MarginFormMarketsState', () => {
  it('shows a retry action when the markets query failed', () => {
    const onRetry = vi.fn()
    const { getByTestId } = render(
      <MarginFormMarketsState isLoading={false} error={new Error('boom')} onRetry={onRetry} />,
    )
    fireEvent.click(getByTestId(TestID.MarginMarketsError).querySelector('button')!)
    expect(onRetry).toHaveBeenCalled()
  })

  it('shows a skeleton while loading and no retry', () => {
    const { getByTestId, queryByTestId } = render(
      <MarginFormMarketsState isLoading error={undefined} onRetry={vi.fn()} />,
    )
    expect(getByTestId(TestID.MarginMarketsLoading)).toBeTruthy()
    expect(queryByTestId(TestID.MarginMarketsError)).toBeNull()
  })

  it('shows a plain empty message with no retry when the request succeeded', () => {
    const { getByTestId, queryByTestId } = render(
      <MarginFormMarketsState isLoading={false} error={undefined} onRetry={vi.fn()} />,
    )
    expect(getByTestId(TestID.MarginMarketsEmpty)).toBeTruthy()
    expect(queryByTestId(TestID.MarginMarketsError)).toBeNull()
  })
})
