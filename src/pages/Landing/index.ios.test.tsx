import { render } from 'test-utils/render'

import Landing from '.'

jest.mock('utils/userAgent', () => {
  return {
    isIOS: true,
  }
})

it('renders ios microsite link', () => {
  const { container } = render(<Landing />)
  expect(container.innerHTML.includes(`https://apps.apple.com/app/apple-store/id6443944476`)).toBeTruthy()
})
