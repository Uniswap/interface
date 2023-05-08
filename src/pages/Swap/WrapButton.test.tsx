import { WrapInputError, WrapType } from 'hooks/useWrapCallback'
import { render, screen } from 'test-utils/render'

import { WrapButton } from './WrapButton'

describe('WrapButton', () => {
  it('should render an error and be disabled, wrap type', () => {
    render(<WrapButton onClick={jest.fn()} error={WrapInputError.INSUFFICIENT_NATIVE_BALANCE} type={WrapType.WRAP} />)
    expect(screen.getByText('Insufficient ETH balance')).toBeInTheDocument()
    expect(screen.getByTestId('wrap-button')).toBeDisabled()
  })

  it('should render an error and be disabled, unwrap type', () => {
    render(
      <WrapButton onClick={jest.fn()} error={WrapInputError.INSUFFICIENT_WRAPPED_BALANCE} type={WrapType.UNWRAP} />
    )
    expect(screen.getByText('Insufficient WETH balance')).toBeInTheDocument()
    expect(screen.getByTestId('wrap-button')).toBeDisabled()
  })

  it('should render a wrap button', () => {
    const clickCallback = jest.fn()
    render(<WrapButton onClick={clickCallback} type={WrapType.WRAP} />)
    expect(screen.getByText('Wrap')).toBeInTheDocument()
    expect(screen.getByTestId('wrap-button')).not.toBeDisabled()
    screen.getByTestId('wrap-button').click()
    expect(clickCallback).toHaveBeenCalled()
  })

  it('should render an unwrap button', () => {
    const clickCallback = jest.fn()
    render(<WrapButton onClick={clickCallback} type={WrapType.UNWRAP} />)
    expect(screen.getByText('Unwrap')).toBeInTheDocument()
    expect(screen.getByTestId('wrap-button')).not.toBeDisabled()
    screen.getByTestId('wrap-button').click()
    expect(clickCallback).toHaveBeenCalled()
  })

  it('should render null', () => {
    render(<WrapButton onClick={jest.fn()} type={WrapType.NOT_APPLICABLE} />)
    expect(screen.queryByTestId('wrap-button')).not.toContainHTML('*')
  })
})
