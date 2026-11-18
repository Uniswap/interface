// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { DetailRow } from '@universe/transactions-ui/src/common/DetailRow/DetailRow'
import { describe, expect, it, vi } from 'vitest'

describe('DetailRow', () => {
  it('renders string label and value', () => {
    render(<DetailRow label="Max slippage" value="0.50%" />)
    expect(screen.getByText('Max slippage')).toBeTruthy()
    expect(screen.getByText('0.50%')).toBeTruthy()
  })

  it('renders node label and value as given', () => {
    render(<DetailRow label={<span>custom label</span>} value={<span>custom value</span>} />)
    expect(screen.getByText('custom label')).toBeTruthy()
    expect(screen.getByText('custom value')).toBeTruthy()
  })

  it('renders the strikethrough price before the value', () => {
    const { container } = render(<DetailRow label="Network cost" strikethroughValue="$1.24" value="$0.42" />)
    expect(container.textContent).toMatch(/\$1\.24.*\$0\.42/)
  })

  it('replaces the value with the skeleton while loading', () => {
    render(<DetailRow isLoading label="Network cost" value="$1.24" />)
    expect(screen.getByText('Network cost')).toBeTruthy()
    expect(screen.queryByText('$1.24')).toBeNull()
  })

  it('renders the caption under the row', () => {
    render(<DetailRow caption="Includes activation" label="Network cost" testID="row" value="$1.24" />)
    expect(screen.getByText('Includes activation')).toBeTruthy()
    expect(screen.getByTestId('row')).toBeTruthy()
  })

  it('renders no chevron without onPress', () => {
    const { container } = render(<DetailRow label="Network cost" value="$1.24" />)
    expect(container.querySelectorAll('svg')).toHaveLength(0)
  })
})
