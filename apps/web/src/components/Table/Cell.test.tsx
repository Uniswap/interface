import { Cell } from 'components/Table/Cell'
import { render, screen } from 'test-utils/render'

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
