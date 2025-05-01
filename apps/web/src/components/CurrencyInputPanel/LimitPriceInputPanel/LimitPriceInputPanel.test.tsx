import 'test-utils/tokens/mocks'

import { LimitPriceInputPanel } from 'components/CurrencyInputPanel/LimitPriceInputPanel/LimitPriceInputPanel'
import { LimitContext } from 'state/limit/LimitContext'
import { MultichainContext } from 'state/multichain/types'
import { SwapAndLimitContext } from 'state/swap/types'
import { act, render, screen } from 'test-utils/render'
import { DAI, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { LimitsExpiry } from 'uniswap/src/types/limits'
import { SwapTab } from 'uniswap/src/types/screens/interface'

const mockMultichainContextValue = {
  reset: jest.fn(),
  setSelectedChainId: jest.fn(),
  setIsUserSelectedToken: jest.fn(),
  isSwapAndLimitContext: true,
  isUserSelectedToken: false,
  isMultichainContext: true,
}

const mockSwapAndLimitContextValue = {
  currencyState: {
    inputCurrency: DAI,
    outputCurrency: undefined,
  },
  prefilledState: {},
  setCurrencyState: jest.fn(),
  currentTab: SwapTab.Limit,
  setCurrentTab: jest.fn(),
}

const mockLimitContextValue = {
  limitState: {
    inputAmount: '',
    limitPrice: '100',
    outputAmount: '',
    expiry: LimitsExpiry.Day,
    isInputAmountFixed: true,
    limitPriceEdited: false,
    limitPriceInverted: false,
  },
  setLimitState: jest.fn(),
  derivedLimitInfo: {
    currencyBalances: {},
    parsedAmounts: {},
  },
}

describe('LimitPriceInputPanel', () => {
  it('should render the component with no currencies selected', async () => {
    const onCurrencySelect = jest.fn()
    await act(async () => {
      return render(<LimitPriceInputPanel onCurrencySelect={onCurrencySelect} />)
    })
    expect(screen.getByText('Limit price')).toBeVisible()
    expect(screen.getByPlaceholderText('0')).toBeVisible()
    expect(screen.getByText('Market')).toBeVisible()
    expect(screen.getByText('+1%')).toBeVisible()
    expect(screen.getByText('+5%')).toBeVisible()
    expect(screen.getByText('+10%')).toBeVisible()
    // TODO(WEB-7196): re-enable snapshot test once VisuallyHidden issue is resolved
    // expect(result.container.firstChild).toMatchSnapshot()
  })

  it('should render correct subheader with inputCurrency defined, but no price', () => {
    const onCurrencySelect = jest.fn()
    render(
      <MultichainContext.Provider value={mockMultichainContextValue}>
        <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
          <LimitPriceInputPanel onCurrencySelect={onCurrencySelect} />
        </SwapAndLimitContext.Provider>
      </MultichainContext.Provider>,
    )
    expect(screen.getByText('Limit price')).toBeVisible()
    expect(screen.getByPlaceholderText('0')).toBeVisible()
    // TODO(WEB-7196): re-enable snapshot test once VisuallyHidden issue is resolved
    // expect(result.container.firstChild).toMatchSnapshot()
  })

  it('should render correct subheader with input currency and limit price defined', () => {
    const onCurrencySelect = jest.fn()
    render(
      <MultichainContext.Provider value={mockMultichainContextValue}>
        <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
          <LimitContext.Provider value={mockLimitContextValue}>
            <LimitPriceInputPanel onCurrencySelect={onCurrencySelect} />
          </LimitContext.Provider>
        </SwapAndLimitContext.Provider>
      </MultichainContext.Provider>,
    )
    expect(screen.getByText('DAI')).toBeVisible()
    expect(screen.getByPlaceholderText('0')).toBeVisible()
  })

  it('should render the output currency when defined', () => {
    const onCurrencySelect = jest.fn()
    const { container } = render(
      <MultichainContext.Provider value={mockMultichainContextValue}>
        <SwapAndLimitContext.Provider
          value={{
            ...mockSwapAndLimitContextValue,
            currencyState: {
              ...mockSwapAndLimitContextValue.currencyState,
              outputCurrency: USDC_MAINNET,
            },
          }}
        >
          <LimitContext.Provider value={mockLimitContextValue}>
            <LimitPriceInputPanel onCurrencySelect={onCurrencySelect} />
          </LimitContext.Provider>
        </SwapAndLimitContext.Provider>
      </MultichainContext.Provider>,
    )
    expect(screen.getByText('DAI')).toBeVisible()
    expect(container.querySelector('.token-symbol-container')).toHaveTextContent('USDC')
    expect(screen.getByPlaceholderText('0')).toBeVisible()
  })
})
