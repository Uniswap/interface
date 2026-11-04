import { fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { PoolFilterRangeInput } from '~/features/Liquidity/PoolsFilter/components'
import { render, screen } from '~/test-utils/render'

const TEST_ID = 'pool-filter-range-input'

function ControlledRangeInput({ onChangeText }: { onChangeText: (value: string) => void }): JSX.Element {
  const [value, setValue] = useState('')
  return (
    <PoolFilterRangeInput
      testID={TEST_ID}
      value={value}
      onChangeText={(next) => {
        onChangeText(next)
        setValue(next)
      }}
    />
  )
}

function renderInput(): { input: HTMLInputElement; onChangeText: ReturnType<typeof vi.fn> } {
  const onChangeText = vi.fn()
  render(<ControlledRangeInput onChangeText={onChangeText} />)
  return { input: screen.getByTestId(TEST_ID) as HTMLInputElement, onChangeText }
}

describe('PoolFilterRangeInput', () => {
  it('accepts decimal input', () => {
    const { input, onChangeText } = renderInput()

    fireEvent.change(input, { target: { value: '12.5' } })

    expect(onChangeText).toHaveBeenLastCalledWith('12.5')
    expect(input.value).toBe('12.5')
  })

  it('rejects alphabetic input and keeps the previous value', () => {
    const { input, onChangeText } = renderInput()

    fireEvent.change(input, { target: { value: '4' } })
    fireEvent.change(input, { target: { value: '4a' } })
    fireEvent.change(input, { target: { value: 'abc' } })

    expect(onChangeText).toHaveBeenCalledTimes(1)
    expect(input.value).toBe('4')
  })

  it.each(['-5', '1e3', '1.2.3', '5%', ' 5'])('rejects %j', (typed) => {
    const { input, onChangeText } = renderInput()

    fireEvent.change(input, { target: { value: typed } })

    expect(onChangeText).not.toHaveBeenCalled()
    expect(input.value).toBe('')
  })

  it('reads a comma as the decimal separator', () => {
    const { input, onChangeText } = renderInput()

    fireEvent.change(input, { target: { value: '1,5' } })

    expect(onChangeText).toHaveBeenLastCalledWith('1.5')
    expect(input.value).toBe('1.5')
  })

  it('allows clearing the field', () => {
    const { input, onChangeText } = renderInput()

    fireEvent.change(input, { target: { value: '7' } })
    fireEvent.change(input, { target: { value: '' } })

    expect(onChangeText).toHaveBeenLastCalledWith('')
    expect(input.value).toBe('')
  })

  it('requests a decimal keyboard on mobile', () => {
    const { input } = renderInput()

    expect(input.getAttribute('inputmode')).toBe('decimal')
  })
})
