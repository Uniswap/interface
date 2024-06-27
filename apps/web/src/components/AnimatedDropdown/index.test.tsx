import { render, screen, waitFor } from 'test-utils/render'

import AnimatedDropdown from './index'

describe('AnimatedDropdown', () => {
  it('does not render children when closed', () => {
    render(<AnimatedDropdown open={false}>Body</AnimatedDropdown>)
    expect(screen.getByText('Body')).not.toBeVisible()
  })

  it('renders children when open', () => {
    render(<AnimatedDropdown open={true}>Body</AnimatedDropdown>)
    expect(screen.getByText('Body')).toBeVisible()
  })

  it('animates when open changes', async () => {
    const { rerender } = render(<AnimatedDropdown open={false}>Body</AnimatedDropdown>)

    const body = screen.getByText('Body')

    expect(body).not.toBeVisible()

    rerender(<AnimatedDropdown open={true}>Body</AnimatedDropdown>)
    expect(body).not.toBeVisible()

    // wait for React Spring animation to finish
    await waitFor(() => {
      expect(body).toBeVisible()
    })
  })
})
