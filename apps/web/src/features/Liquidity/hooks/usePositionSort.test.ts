import { act, renderHook } from '@testing-library/react'
import { PositionSortBy } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { positionSortToRequest, usePositionSort } from '~/features/Liquidity/hooks/usePositionSort'

describe('usePositionSort', () => {
  it('defaults to value descending', () => {
    const { result } = renderHook(() => usePositionSort())

    expect(result.current.sort).toEqual({ field: 'liquidity', direction: 'desc' })
  })

  it('a newly selected column starts descending', () => {
    const { result } = renderHook(() => usePositionSort())

    act(() => result.current.onSort('apr'))

    expect(result.current.sort).toEqual({ field: 'apr', direction: 'desc' })
  })

  it('re-selecting the active column flips its direction', () => {
    const { result } = renderHook(() => usePositionSort())

    act(() => result.current.onSort('apr'))
    act(() => result.current.onSort('apr'))
    expect(result.current.sort).toEqual({ field: 'apr', direction: 'asc' })

    act(() => result.current.onSort('apr'))
    expect(result.current.sort).toEqual({ field: 'apr', direction: 'desc' })
  })
})

describe('positionSortToRequest', () => {
  it('omits the sort fields when no column is active', () => {
    expect(positionSortToRequest(undefined)).toEqual({})
  })

  it('maps the APR column to the APR request sort in both directions', () => {
    expect(positionSortToRequest({ field: 'apr', direction: 'desc' })).toEqual({
      sortBy: PositionSortBy.APR,
      ascending: false,
    })
    expect(positionSortToRequest({ field: 'apr', direction: 'asc' })).toEqual({
      sortBy: PositionSortBy.APR,
      ascending: true,
    })
  })
})
