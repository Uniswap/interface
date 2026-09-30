import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useRwaTablePagination } from '~/pages/Explore/rwa/table/hooks/useRwaTablePagination'

type Params = Parameters<typeof useRwaTablePagination>[0]

function setup(initial: Partial<Params> = {}) {
  const fetchNextPage = vi.fn()
  const base: Params = {
    rowsKey: 'stocks',
    loadedRowCount: 50,
    filteredRowCount: 50,
    hasNextPage: true,
    isFetchingNextPage: false,
    fetchNextPage,
    ...initial,
  }
  const hook = renderHook((params: Params) => useRwaTablePagination(params), { initialProps: base })
  const loadMore = (): void => {
    act(() => hook.result.current.loadMore?.({}))
  }
  return { ...hook, base, fetchNextPage, loadMore }
}

describe('useRwaTablePagination', () => {
  it('reveals loaded rows before asking the server for more', () => {
    const { result, fetchNextPage, loadMore } = setup()
    const pageSize = result.current.displayCount

    loadMore()
    expect(result.current.displayCount).toBe(pageSize * 2)
    expect(fetchNextPage).not.toHaveBeenCalled()
  })

  it('fetches the next page only once the window has consumed every loaded row', () => {
    const { result, fetchNextPage, loadMore } = setup({ loadedRowCount: 10, filteredRowCount: 10 })
    expect(result.current.loadMore).toBeDefined()

    loadMore()
    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })

  it('does not page the server while a search filter hides rows the window has not reached', () => {
    const { result, fetchNextPage } = setup({ loadedRowCount: 50, filteredRowCount: 3 })

    expect(result.current.loadMore).toBeUndefined()
    expect(fetchNextPage).not.toHaveBeenCalled()
  })

  it('caps the pre-grown window so a failed fetch cannot inflate it', () => {
    const { result, fetchNextPage, loadMore } = setup({ loadedRowCount: 10, filteredRowCount: 10 })
    const pageSize = result.current.displayCount

    loadMore()
    loadMore()
    loadMore()
    expect(result.current.displayCount).toBe(10 + pageSize)
    expect(fetchNextPage).toHaveBeenCalledTimes(3)
  })

  it('restarts the window when the row source changes, even at the same row count', () => {
    const { result, rerender, base, loadMore } = setup({ loadedRowCount: 100, filteredRowCount: 100 })
    const pageSize = result.current.displayCount
    loadMore()
    loadMore()
    expect(result.current.displayCount).toBe(pageSize * 3)

    rerender({ ...base, rowsKey: 'etfs', loadedRowCount: 100, filteredRowCount: 100 })
    expect(result.current.displayCount).toBe(pageSize)
  })

  it('keeps the window when a page is appended to the same source', () => {
    const { result, rerender, base, loadMore } = setup({ loadedRowCount: 10, filteredRowCount: 10 })
    const pageSize = result.current.displayCount
    loadMore()

    rerender({ ...base, loadedRowCount: 20, filteredRowCount: 20 })
    expect(result.current.displayCount).toBe(10 + pageSize)
  })

  it('completes synchronously when only revealing already-loaded rows', () => {
    const { result } = setup()
    const onComplete = vi.fn()

    act(() => result.current.loadMore?.({ onComplete }))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('defers onComplete until the server page has landed', () => {
    const { result, rerender, base } = setup({ loadedRowCount: 10, filteredRowCount: 10 })
    const onComplete = vi.fn()

    act(() => result.current.loadMore?.({ onComplete }))
    expect(onComplete).not.toHaveBeenCalled()

    rerender({ ...base, loadedRowCount: 10, filteredRowCount: 10, isFetchingNextPage: true })
    expect(onComplete).not.toHaveBeenCalled()

    rerender({ ...base, loadedRowCount: 20, filteredRowCount: 20, isFetchingNextPage: false })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('stops offering loadMore when everything is shown and the server has no more pages', () => {
    const { result } = setup({ loadedRowCount: 5, filteredRowCount: 5, hasNextPage: false })
    expect(result.current.loadMore).toBeUndefined()
  })
})
