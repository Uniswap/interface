import { fireEvent } from '@testing-library/react-native'
import React from 'react'
import {
  TokenDetailsBuySellButtons,
  TokenDetailsSwapButtons,
} from 'src/components/TokenDetails/TokenDetailsActionButtons'
import { render } from 'src/test/test-utils'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

jest.mock('@universe/gating', () => ({
  ...jest.requireActual('@universe/gating'),
  useFeatureFlag: jest.fn().mockReturnValue(false),
  useFeatureFlagWithLoading: jest.fn().mockReturnValue({ value: false, isLoading: false }),
  useFeatureFlagWithExposureLoggingDisabled: jest.fn().mockReturnValue(false),
}))

jest.mock('src/components/TokenDetails/TokenDetailsContext', () => ({
  useTokenDetailsContext: jest.fn().mockReturnValue({
    currencyInfo: {
      currency: { isToken: false },
      safetyInfo: { tokenList: 'default' },
    },
    isChainEnabled: true,
    tokenColor: '#627EEA',
  }),
}))

describe('TokenDetailsSwapButtons', () => {
  const defaultProps = {
    ctaButton: { title: 'Swap', onPress: jest.fn() },
    userHasBalance: false,
    actionMenuOptions: [],
    onPressDisabled: jest.fn(),
  }

  beforeEach(() => jest.clearAllMocks())

  it('should render the CTA button', () => {
    const { getByTestId } = render(<TokenDetailsSwapButtons {...defaultProps} />)

    expect(getByTestId(TestID.TokenDetailsSwapButton)).toBeTruthy()
  })

  it('should call ctaButton.onPress when CTA is tapped', () => {
    const { getByTestId } = render(<TokenDetailsSwapButtons {...defaultProps} />)

    fireEvent.press(getByTestId(TestID.TokenDetailsSwapButton), ON_PRESS_EVENT_PAYLOAD)

    expect(defaultProps.ctaButton.onPress).toHaveBeenCalledTimes(1)
  })

  it('should show action menu when user has balance', () => {
    const { getByTestId } = render(<TokenDetailsSwapButtons {...defaultProps} userHasBalance />)

    expect(getByTestId(TestID.TokenDetailsActionButton)).toBeTruthy()
  })

  it('should hide action menu when user has no balance', () => {
    const { queryByTestId } = render(<TokenDetailsSwapButtons {...defaultProps} userHasBalance={false} />)

    expect(queryByTestId(TestID.TokenDetailsActionButton)).toBeNull()
  })
})

describe('TokenDetailsBuySellButtons', () => {
  const defaultProps = {
    userHasBalance: false,
    actionMenuOptions: [],
    onPressDisabled: jest.fn(),
    onPressBuy: jest.fn(),
    onPressSell: jest.fn(),
  }

  beforeEach(() => jest.clearAllMocks())

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

    expect(getByText('Buy')).toBeTruthy()
  })

  it('should show action menu when using default Buy title', () => {
    const { getByTestId } = render(<TokenDetailsBuySellButtons {...defaultProps} userHasBalance />)

    expect(getByTestId(TestID.TokenDetailsActionButton)).toBeTruthy()
  })

  it('should hide action menu when buyButtonTitle is set', () => {
    const { queryByTestId } = render(
      <TokenDetailsBuySellButtons {...defaultProps} userHasBalance buyButtonTitle="Buy with cash" />,
    )

    expect(queryByTestId(TestID.TokenDetailsActionButton)).toBeNull()
  })
})
