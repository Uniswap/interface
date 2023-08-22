import { render } from 'test-utils/render'

import Landing from '.'

jest.mock('utils/userAgent', () => {
  return {
    isIOS: false,
  }
})

it('renders non-ios microsite link', () => {
  const { container } = render(<Landing />)
  expect(container.innerHTML.includes(`https://wallet.uniswap.org/?utm_source=home_page`)).toBeTruthy()
})
