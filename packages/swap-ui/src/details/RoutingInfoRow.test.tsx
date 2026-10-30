// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BestRouteLabel, RoutingInfoRow } from './RoutingInfoRow'

describe('RoutingInfoRow', () => {
  it('renders both slots', () => {
    render(<RoutingInfoRow info={<span>info slot</span>} label={<span>label slot</span>} />)
    expect(screen.getByText('info slot')).toBeTruthy()
    expect(screen.getByText('label slot')).toBeTruthy()
  })
})

describe('BestRouteLabel', () => {
  it('wraps the label in a row by default, for the hop and plan rows', () => {
    const { container } = render(<BestRouteLabel />)
    const label = screen.getByText('common.bestRoute')
    expect(label.parentElement).not.toBe(container)
    expect(label.parentElement?.parentElement).toBe(container)
  })

  it('renders the bare label when unwrapped, for the Across row', () => {
    const { container } = render(<BestRouteLabel wrapped={false} />)
    expect(screen.getByText('common.bestRoute').parentElement).toBe(container)
  })
})
