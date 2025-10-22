import { renderHook } from '@testing-library/react'
import { useValueAsRef } from 'utilities/src/react/useValueAsRef'

describe('useValueAsRef', () => {
  it('returns undefined if no value is passed on first render', () => {
    const { result } = renderHook(() => useValueAsRef(undefined))
    expect(result.current.current).toBe(undefined)
  })

  it('returns the new value on every render', () => {
    const { result, rerender } = renderHook((props) => useValueAsRef(props), {
      initialProps: 'aaa',
    })

    expect(result.current.current).toBe('aaa')

    rerender('bbb')
    expect(result.current.current).toBe('bbb')

    rerender('ccc')
    expect(result.current.current).toBe('ccc')
  })
})
