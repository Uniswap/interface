import { render } from 'test-utils/render'

import { DataPage } from './DataPage'

it('placeholder containers load', () => {
  const { asFragment } = render(<DataPage />)
  expect(asFragment()).toMatchSnapshot()
})
