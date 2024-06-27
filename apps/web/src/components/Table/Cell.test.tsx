import { render, screen } from '@testing-library/react'

import { Cell } from './Cell'

describe('Table Cell', () => {
  it('shows loading bubble', () => {
    render(<Cell loading>TestData</Cell>)
    const testDataElements = screen.queryAllByText('TestData')
    expect(testDataElements.length).toBe(0)
  })

  it('shows data', () => {
    render(<Cell>TestData</Cell>)
    const testDataElements = screen.queryAllByText('TestData')
    expect(testDataElements.length).toBeGreaterThan(0)
  })
})
