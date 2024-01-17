import { render, screen } from 'test-utils/render'

import { GetTheAppButton } from './GetTheAppButton'

describe('GetTheAppButton', () => {
  it('displays a button with call to action text and icons', () => {
    const { container } = render(<GetTheAppButton />)

    expect(container).toMatchSnapshot()
    expect(screen.getByText('Get the app')).toBeVisible()
    expect(screen.getByTestId('apple-logo')).toBeVisible()
    expect(screen.getByTestId('google-play-store-logo')).toBeVisible()
  })
})
