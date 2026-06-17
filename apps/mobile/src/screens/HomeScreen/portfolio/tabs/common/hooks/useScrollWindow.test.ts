import { makeMutable } from 'react-native-reanimated'
import { useScrollWindow } from 'src/screens/HomeScreen/portfolio/tabs/common/hooks/useScrollWindow'
import { renderHook } from 'src/test/test-utils'

const ROW_HEIGHT = 64
const VIEWPORT_HEIGHT = 800

const renderScrollWindow = (params: { numRows: number; rowHeight?: number; bodyOffsetY?: number }) =>
  renderHook(() =>
    useScrollWindow({
      feedScrollValue: makeMutable(0),
      viewportHeight: VIEWPORT_HEIGHT,
      bodyOffsetY: params.bodyOffsetY ?? 0,
      numRows: params.numRows,
      rowHeight: params.rowHeight ?? ROW_HEIGHT,
    }),
  )

describe('useScrollWindow', () => {
  it('marks every row visible when the list fits within the initial window', () => {
    const { result } = renderScrollWindow({ numRows: 3 })

    expect(result.current(0)).toBe(true)
    expect(result.current(1)).toBe(true)
    expect(result.current(2)).toBe(true)
  })

  it('windows rows beyond the initial range as not visible before scrolling', () => {
    // With a 64dp row, viewport 800 + 1500 buffer covers ~37 rows from the top.
    const { result } = renderScrollWindow({ numRows: 200 })

    expect(result.current(0)).toBe(true)
    expect(result.current(37)).toBe(true)
    expect(result.current(38)).toBe(false)
    expect(result.current(199)).toBe(false)
  })

  it('does not produce NaN windows when rowHeight is zero', () => {
    const { result } = renderScrollWindow({ numRows: 5, rowHeight: 0 })

    expect(result.current(0)).toBe(true)
    expect(result.current(4)).toBe(true)
  })
})
