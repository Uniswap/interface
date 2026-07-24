import { fireEvent } from '@testing-library/react-native'
import React from 'react'
import { TokenDetailsBuySellButtons } from 'src/components/TokenDetails/TokenDetailsActionButtons'
import { render } from 'src/test/test-utils'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

vi.mock('@universe/gating', async () => ({
  ...(await vi.importActual('@universe/gating')),
  useFeatureFlag: vi.fn().mockReturnValue(false),
  useFeatureFlagWithLoading: vi.fn().mockReturnValue({ value: false, isLoading: false }),
  useFeatureFlagWithExposureLoggingDisabled: vi.fn().mockReturnValue(false),
}))

vi.mock('src/components/TokenDetails/TokenDetailsContext', () => ({
  useTokenDetailsContext: vi.fn().mockReturnValue({
    currencyInfo: {
      currency: { isToken: false },
      safetyInfo: { tokenList: 'default' },
    },
    isChainEnabled: true,
    tokenColor: '#627EEA',
  }),
}))

describe('TokenDetailsBuySellButtons', () => {
  const defaultProps = {
    userHasBalance: false,
    actionMenuOptions: [],
    onPressDisabled: vi.fn(),
    onPressBuy: vi.fn(),
    onPressSell: vi.fn(),
  }

  beforeEach(() => vi.clearAllMocks())

  it('should always render the Buy button', () => {
    const { getByTestId } = render(<TokenDetailsBuySellButtons {...defaultProps} />)

    expect(getByTestId(TestID.TokenDetailsBuyButton)).toBeTruthy()
  })

  it('should call onPressBuy when Buy is tapped', () => {
    const { getByTestId } = render(<TokenDetailsBuySellButtons {...defaultProps} />)

    fireEvent.press(getByTestId(TestID.TokenDetailsBuyButton), ON_PRESS_EVENT_PAYLOAD)

    expect(defaultProps.onPressBuy).toHaveBeenCalledTimes(1)
  })

  it('should show Sell button when user has balance', () => {
    const { getByTestId } = render(<TokenDetailsBuySellButtons {...defaultProps} userHasBalance />)

    expect(getByTestId(TestID.TokenDetailsSellButton)).toBeTruthy()
  })

  it('should hide Sell button when user has no balance', () => {
    const { queryByTestId } = render(<TokenDetailsBuySellButtons {...defaultProps} userHasBalance={false} />)

    expect(queryByTestId(TestID.TokenDetailsSellButton)).toBeNull()
  })

  it('should call onPressSell when Sell is tapped', () => {
    const { getByTestId } = render(<TokenDetailsBuySellButtons {...defaultProps} userHasBalance />)

    fireEvent.press(getByTestId(TestID.TokenDetailsSellButton), ON_PRESS_EVENT_PAYLOAD)

    expect(defaultProps.onPressSell).toHaveBeenCalledTimes(1)
  })

  it('should render custom buyButtonTitle when provided', () => {
    const { getByText } = render(<TokenDetailsBuySellButtons {...defaultProps} buyButtonTitle="Buy with cash" />)

    expect(getByText('Buy with cash')).toBeTruthy()
  })

  it('should render default "Buy" title when buyButtonTitle is not provided', () => {
    const { getByText } = render(<TokenDetailsBuySellButtons {...defaultProps} />)

    expect(getByText('common.button.buy')).toBeTruthy()
  })

  it('should show action menu when using default Buy title', () => {
    const { getByTestId } = render(<TokenDetailsBuySellButtons {...defaultProps} userHasBalance />)

    expect(getByTestId(TestID.TokenDetailsActionButton)).toBeTruthy()
  })

  it('should hide action menu when buyButtonTitle is set and user has no balance', () => {
    const { queryByTestId } = render(
      <TokenDetailsBuySellButtons {...defaultProps} userHasBalance={false} buyButtonTitle="Buy with cash" />,
    )

    expect(queryByTestId(TestID.TokenDetailsActionButton)).toBeNull()
  })

  it('should keep action menu visible for holders when buyButtonTitle is set', () => {
    const { getByTestId } = render(
      <TokenDetailsBuySellButtons
        {...defaultProps}
        userHasBalance
        buyButtonDisabled
        sellButtonDisabled
        buyButtonTitle="Unavailable to trade"
        onPressDisabled={undefined}
      />,
    )

    expect(getByTestId(TestID.TokenDetailsActionButton)).toBeTruthy()
  })

  it('should not call onPressBuy when buyButtonDisabled is set', () => {
    const { getByTestId } = render(
      <TokenDetailsBuySellButtons
        {...defaultProps}
        buyButtonDisabled
        buyButtonTitle="Unavailable to trade"
        onPressDisabled={undefined}
      />,
    )

    fireEvent.press(getByTestId(TestID.TokenDetailsBuyButton), ON_PRESS_EVENT_PAYLOAD)

    expect(defaultProps.onPressBuy).not.toHaveBeenCalled()
  })

  it('should not call onPressSell when sellButtonDisabled is set', () => {
    const { getByTestId } = render(
      <TokenDetailsBuySellButtons {...defaultProps} userHasBalance sellButtonDisabled onPressDisabled={undefined} />,
    )

    fireEvent.press(getByTestId(TestID.TokenDetailsSellButton), ON_PRESS_EVENT_PAYLOAD)

    expect(defaultProps.onPressSell).not.toHaveBeenCalled()
  })
})
