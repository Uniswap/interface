import { render } from 'test-utils/render'

import { LimitPriceIncrementButtons } from './LimitPriceIncrementButtons'

describe('LimitPriceIncrementButtons', () => {
  it('should render both buttons and callbacks should fire', () => {
    const increment = jest.fn()
    const decrement = jest.fn()
    const { container } = render(<LimitPriceIncrementButtons onIncrement={increment} onDecrement={decrement} />)
    expect(container.querySelectorAll('button')).toHaveLength(2)
    container.querySelectorAll('button')[0].click()
    expect(decrement).toHaveBeenCalled()
    container.querySelectorAll('button')[1].click()
    expect(increment).toHaveBeenCalled()
  })
})
