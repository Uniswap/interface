import { act, renderHook } from '@testing-library/react'
import { useDigitInput } from 'uniswap/src/components/passkey/recovery/useDigitInput'
import { describe, expect, it, vi } from 'vitest'

type FakeRef = { focus: () => void }

function attachRefs(refs: React.MutableRefObject<(FakeRef | null)[]>, length: number): FakeRef[] {
  const fakes = Array.from({ length }, () => ({ focus: vi.fn() }))
  for (let i = 0; i < length; i++) {
    refs.current[i] = fakes[i] ?? null
  }
  return fakes
}

describe('useDigitInput', () => {
  it('rejects non-digit input without advancing focus', () => {
    const { result } = renderHook(() => useDigitInput({ length: 4 }))
    const refs = attachRefs(result.current.refs, 4)

    act(() => result.current.handleChange(0, 'a'))
    expect(result.current.digits).toEqual(['', '', '', ''])
    expect(refs[1]?.focus).not.toHaveBeenCalled()
  })

  it('accepts a digit, stores it, and advances focus', () => {
    const { result } = renderHook(() => useDigitInput({ length: 4 }))
    const refs = attachRefs(result.current.refs, 4)

    act(() => result.current.handleChange(0, '5'))
    expect(result.current.digits[0]).toBe('5')
    expect(refs[1]?.focus).toHaveBeenCalledTimes(1)
  })

  it('fires onComplete once all digits filled', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useDigitInput({ length: 4, onComplete }))
    attachRefs(result.current.refs, 4)

    act(() => result.current.handleChange(0, '1'))
    act(() => result.current.handleChange(1, '2'))
    act(() => result.current.handleChange(2, '3'))
    expect(onComplete).not.toHaveBeenCalled()
    act(() => result.current.handleChange(3, '4'))
    expect(onComplete).toHaveBeenCalledWith('1234')
  })

  it('backspace on empty cell steps focus backward', () => {
    const { result } = renderHook(() => useDigitInput({ length: 4 }))
    const refs = attachRefs(result.current.refs, 4)

    // Fill cell 0 so the handler doesn't treat cell 1 as having content.
    act(() => result.current.handleChange(0, '9'))
    // Simulate backspace on an empty cell.
    act(() => result.current.handleKeyDown(1, { key: 'Backspace' }))
    expect(refs[0]?.focus).toHaveBeenCalled()
  })

  it('paste distributes digits, strips non-digits, and completes when full', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useDigitInput({ length: 6, onComplete }))
    attachRefs(result.current.refs, 6)

    act(() =>
      result.current.handlePaste({
        preventDefault: vi.fn(),
        clipboardData: { getData: () => '12-ab34x56' },
      }),
    )
    expect(result.current.digits).toEqual(['1', '2', '3', '4', '5', '6'])
    expect(onComplete).toHaveBeenCalledWith('123456')
  })

  it('partial paste advances focus to the first empty cell but does not complete', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useDigitInput({ length: 6, onComplete }))
    const refs = attachRefs(result.current.refs, 6)

    act(() =>
      result.current.handlePaste({
        preventDefault: vi.fn(),
        clipboardData: { getData: () => '123' },
      }),
    )
    expect(result.current.digits.slice(0, 3)).toEqual(['1', '2', '3'])
    expect(refs[3]?.focus).toHaveBeenCalled()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('reset clears all digits and focuses the first cell', () => {
    const { result } = renderHook(() => useDigitInput({ length: 4 }))
    const refs = attachRefs(result.current.refs, 4)
    act(() => result.current.handleChange(0, '1'))
    act(() => result.current.handleChange(1, '2'))

    act(() => result.current.reset())
    expect(result.current.digits).toEqual(['', '', '', ''])
    expect(refs[0]?.focus).toHaveBeenCalled()
  })
})
