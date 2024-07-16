import { renderHook } from '@testing-library/react-native'
import { Dimensions } from 'react-native'
import { useChartDimensions } from 'src/components/PriceExplorer/useChartDimensions'
import { heightBreakpoints } from 'ui/src/theme'

const sharedDimensions = {
  height: 1000,
  width: 1000,
  scale: 1,
  fontScale: 1,
}

describe(useChartDimensions, () => {
  it('returns small chart height for small screens', () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ ...sharedDimensions, height: heightBreakpoints.short - 1 })
    const { result } = renderHook(() => useChartDimensions())

    expect(result.current).toEqual({
      chartHeight: 130,
      chartWidth: 1000,
      buttonWidth: expect.any(Number),
      labelWidth: expect.any(Number),
    })
  })

  it('returns large chart height for large screens', () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ ...sharedDimensions, height: heightBreakpoints.short })
    const { result } = renderHook(() => useChartDimensions())

    expect(result.current).toEqual({
      chartHeight: 215,
      chartWidth: 1000,
      buttonWidth: expect.any(Number),
      labelWidth: expect.any(Number),
    })
  })
})
