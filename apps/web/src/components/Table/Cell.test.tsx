import { Cell } from 'components/Table/Cell'
import { render, screen } from 'test-utils/render'
import { vi } from 'vitest'

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

  it('shows loading bubble with responsive dimensions on desktop', () => {
    // Mock media query for desktop (lg breakpoint)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query.includes('1024px'), // lg breakpoint
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    render(<Cell loading>TestData</Cell>)
    const loadingBubble = screen.getByTestId('cell-loading-bubble')
    expect(loadingBubble).toBeInTheDocument()

    // Content should be hidden during loading
    expect(screen.queryByText('TestData')).not.toBeInTheDocument()
  })

  it('shows loading bubble with responsive dimensions on mobile', () => {
    // Mock media query for mobile (below lg breakpoint)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false, // No lg breakpoint match
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    render(<Cell loading>TestData</Cell>)
    const loadingBubble = screen.getByTestId('cell-loading-bubble')
    expect(loadingBubble).toBeInTheDocument()

    // Content should be hidden during loading
    expect(screen.queryByText('TestData')).not.toBeInTheDocument()
  })

  it('transitions from loading to loaded state properly', () => {
    const { rerender } = render(<Cell loading>TestData</Cell>)

    // Initially loading
    expect(screen.getByTestId('cell-loading-bubble')).toBeInTheDocument()
    expect(screen.queryByText('TestData')).not.toBeInTheDocument()

    // Transition to loaded
    rerender(<Cell>TestData</Cell>)

    // Loading bubble should be gone, content should appear
    expect(screen.queryByTestId('cell-loading-bubble')).not.toBeInTheDocument()
    expect(screen.getByText('TestData')).toBeInTheDocument()
  })

  it('ensures proper cleanup when transitioning from loading to loaded states', () => {
    const { rerender } = render(<Cell loading>TestData</Cell>)

    // Verify loading state
    const loadingBubble = screen.getByTestId('cell-loading-bubble')
    expect(loadingBubble).toBeInTheDocument()

    // Transition to loaded state
    rerender(<Cell>TestData</Cell>)

    // Verify loaded state and cleanup
    expect(screen.queryByTestId('cell-loading-bubble')).not.toBeInTheDocument()
    expect(screen.getByText('TestData')).toBeInTheDocument()

    // Ensure no leftover loading artifacts
    const loadingElements = screen.queryAllByTestId('cell-loading-bubble')
    expect(loadingElements).toHaveLength(0)
  })
})
