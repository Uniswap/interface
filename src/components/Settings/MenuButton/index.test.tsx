import { Percent } from '@uniswap/sdk-core'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { SlippageTolerance } from 'state/user/types'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'
import noop from 'utils/noop'

import MenuButton from '.'

jest.mock('state/user/hooks')

const renderButton = () => {
  const { asFragment } = render(<MenuButton disabled={false} onClick={noop} isActive={false} />)
  return asFragment()
}

describe('MenuButton', () => {
  it('should render an icon when slippage is Auto', () => {
    mocked(useUserSlippageTolerance).mockReturnValue([SlippageTolerance.Auto, noop])
    expect(renderButton()).toMatchSnapshot()
  })
  it('should render an icon with a custom slippage value', () => {
    mocked(useUserSlippageTolerance).mockReturnValue([new Percent(5, 10_000), noop])
    expect(renderButton()).toMatchSnapshot()
  })
  it('should render an icon with a custom slippage and a warning when value is out of bounds', () => {
    mocked(useUserSlippageTolerance).mockReturnValue([new Percent(1, 10_000), noop])
    expect(renderButton()).toMatchSnapshot()
  })
})
