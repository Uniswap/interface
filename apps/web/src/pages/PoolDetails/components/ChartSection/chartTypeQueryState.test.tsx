import { renderHook } from '@testing-library/react'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import type { ReactNode } from 'react'
import { usePdpChartTypeQueryState } from '~/pages/PoolDetails/components/ChartSection/chartTypeQueryState'
import { ChartType } from '~/utils/charts'

const mockFlagEnabled = vi.hoisted(() => ({ value: false }))
vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: () => mockFlagEnabled.value,
}))

function renderChartType(search: string): ChartType {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <NuqsTestingAdapter searchParams={search}>{children}</NuqsTestingAdapter>
  )
  return renderHook(() => usePdpChartTypeQueryState()[0], { wrapper }).result.current
}

describe('usePdpChartTypeQueryState', () => {
  describe('with pdp_revamp off', () => {
    beforeEach(() => {
      mockFlagEnabled.value = false
    })

    it('defaults to Volume and keeps ?chart=volume', () => {
      expect(renderChartType('')).toBe(ChartType.VOLUME)
      expect(renderChartType('?chart=volume')).toBe(ChartType.VOLUME)
    })
  })

  describe('with pdp_revamp on', () => {
    beforeEach(() => {
      mockFlagEnabled.value = true
    })

    it('reads the default and old ?chart=volume links as Price', () => {
      expect(renderChartType('')).toBe(ChartType.PRICE)
      expect(renderChartType('?chart=volume')).toBe(ChartType.PRICE)
    })

    it('leaves the other tabs as they are', () => {
      expect(renderChartType('?chart=liquidity')).toBe(ChartType.LIQUIDITY)
      expect(renderChartType('?chart=depth')).toBe(ChartType.DEPTH)
    })
  })
})
