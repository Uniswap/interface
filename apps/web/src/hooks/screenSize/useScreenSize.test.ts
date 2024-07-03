import { useScreenSize } from 'hooks/screenSize/useScreenSize'
import { renderHook } from 'test-utils/render'

describe('useScreenSize', () => {
  it('returns the right initial value based on breakpoints', () => {
    const { result } = renderHook(() => useScreenSize())
    expect(result).toMatchSnapshot()
  })
})
