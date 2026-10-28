// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EstimatedSwapTime } from './EstimatedSwapTime'

describe('EstimatedSwapTime', () => {
  it('formats minutes and seconds', () => {
    render(<EstimatedSwapTime timeMs={150_000} showIfLongerThanCutoff />)
    expect(screen.getByText('bridging.estimatedTime.minutesAndSeconds')).toBeTruthy()
  })

  it('formats whole minutes', () => {
    render(<EstimatedSwapTime timeMs={120_000} showIfLongerThanCutoff />)
    expect(screen.getByText('bridging.estimatedTime.minutesOnly')).toBeTruthy()
  })

  it('formats seconds only', () => {
    render(<EstimatedSwapTime timeMs={45_000} showIfLongerThanCutoff={false} />)
    expect(screen.getByText('bridging.estimatedTime.secondsOnly')).toBeTruthy()
  })

  it('renders nothing without a time', () => {
    const { container } = render(<EstimatedSwapTime showIfLongerThanCutoff />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when the mount point disagrees with the cutoff', () => {
    const below = render(<EstimatedSwapTime timeMs={45_000} showIfLongerThanCutoff />)
    expect(below.container.firstChild).toBeNull()
    const above = render(<EstimatedSwapTime timeMs={150_000} showIfLongerThanCutoff={false} />)
    expect(above.container.firstChild).toBeNull()
  })

  it('honours a custom cutoff', () => {
    render(<EstimatedSwapTime timeMs={45_000} cutoffTimeMs={30_000} showIfLongerThanCutoff />)
    expect(screen.getByText('bridging.estimatedTime.secondsOnly')).toBeTruthy()
  })
})
