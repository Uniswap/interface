import { render, screen } from 'test-utils/render'

import AnimatedDropdown from './index'

describe('AnimatedDropdown', () => {
  it('does not render children when closed', async () => {
    render(<AnimatedDropdown open={false}>Body</AnimatedDropdown>)
    expect(screen.getByText('Body')).not.toBeVisible()
  })

  it('renders children when open', () => {
    render(<AnimatedDropdown open={true}>Body</AnimatedDropdown>)
    expect(screen.getByText('Body')).toBeVisible()
  })
})
