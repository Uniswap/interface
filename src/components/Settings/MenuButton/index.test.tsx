import { Percent } from '@uniswap/sdk-core'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { SlippageTolerance } from 'state/user/types'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'
import { lightTheme } from 'theme/colors'
import noop from 'utils/noop'

import MenuButton from '.'

jest.mock('state/user/hooks')

const renderButton = () => {
  render(<MenuButton disabled={false} onClick={noop} isActive={false} />)
}

describe('MenuButton', () => {
  it('should render an icon when slippage is Auto', () => {
    mocked(useUserSlippageTolerance).mockReturnValue([SlippageTolerance.Auto, noop])
    renderButton()
    expect(screen.queryByText('slippage')).not.toBeInTheDocument()
  })
  it('should render an icon with a custom slippage value', () => {
    mocked(useUserSlippageTolerance).mockReturnValue([new Percent(5, 10_000), noop])
    renderButton()
    expect(screen.queryByText('0.05% slippage')).toBeInTheDocument()
  })
  it('should render an icon with a custom slippage and a warning when value is out of bounds', () => {
    mocked(useUserSlippageTolerance).mockReturnValue([new Percent(1, 10_000), noop])
    renderButton()
    expect(screen.getByTestId('settings-icon-with-slippage')).toHaveStyleRule(
      'background-color',
      lightTheme.accentWarningSoft
    )
  })
})
