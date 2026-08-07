import { act, renderHook } from '@testing-library/react'
import { useFavoritesDraftOrder } from 'src/components/explore/useFavoritesDraftOrder'

describe(useFavoritesDraftOrder, () => {
  it('applies a queued order only after the active item settles', () => {
    const persist = vi.fn()
    const { result } = renderHook(() => useFavoritesDraftOrder({ items: ['a', 'b', 'c'], persist }))

    act(() => {
      result.current.queueDraftOrder(['b', 'a', 'c'])
    })
    expect(result.current.orderedItems).toEqual(['a', 'b', 'c'])

    act(() => {
      result.current.settleDraftOrder()
    })
    expect(result.current.orderedItems).toEqual(['b', 'a', 'c'])
  })

  it('uses live items for membership while preserving the draft ordering', () => {
    const persist = vi.fn()
    const { result, rerender } = renderHook(({ items }) => useFavoritesDraftOrder({ items, persist }), {
      initialProps: { items: ['a', 'b', 'c'] },
    })

    act(() => {
      result.current.queueDraftOrder(['b', 'a', 'c'])
      result.current.settleDraftOrder()
    })
    rerender({ items: ['a', 'b', 'd'] })

    expect(result.current.orderedItems).toEqual(['b', 'a', 'd'])
  })

  it('persists a pending order when editing ends before settle completes', () => {
    const persist = vi.fn()
    const { result } = renderHook(() => useFavoritesDraftOrder({ items: ['a', 'b', 'c'], persist }))

    act(() => {
      result.current.setIsEditing(true)
      result.current.queueDraftOrder(['c', 'a', 'b'])
      result.current.setIsEditing(false)
    })

    expect(persist).toHaveBeenCalledWith(['c', 'a', 'b'])
    expect(result.current.isEditing).toBe(false)
  })
})
