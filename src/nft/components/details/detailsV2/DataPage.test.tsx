import { TEST_NFT_ASSET } from 'test-utils/constants'
import { render } from 'test-utils/render'

import { DataPage } from './DataPage'

it('placeholder containers load', () => {
  const { asFragment } = render(<DataPage asset={TEST_NFT_ASSET} />)
  expect(asFragment()).toMatchSnapshot()
})
