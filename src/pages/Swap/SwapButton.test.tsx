import { CurrencyAmount, TradeType, WETH9 } from '@uniswap/sdk-core'
import { DAI_MAINNET, nativeOnChain, V3Route } from '@uniswap/smart-order-router'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { SupportedChainId } from 'constants/chains'
import { USDC_MAINNET, WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { useBestTrade } from 'hooks/useBestTrade'
import usePermit2Allowance, { AllowanceState } from 'hooks/usePermit2Allowance'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import JSBI from 'jsbi'
import { useCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
import { InterfaceTrade, TradeState } from 'state/routing/types'
import { Field } from 'state/swap/actions'
import { DerivedSwapInfoContextProvider } from 'state/swap/hooks'
import { SwapState } from 'state/swap/reducer'
import { toCurrencyAmount } from 'test-utils/constants'
import { mocked } from 'test-utils/mocked'
import { act, render, screen } from 'test-utils/render'
import { warningSeverity } from 'utils/prices'
import { switchChain } from 'utils/switchChain'

import { SwapButton } from './SwapButton'

function getSwapState(input: string, output: string): SwapState {
  return {
    independentField: Field.INPUT,
    typedValue: '1',
    [Field.INPUT]: {
      currencyId: input,
    },
    [Field.OUTPUT]: {
      currencyId: output,
    },
    recipient: null,
  }
}

const TEST_TRADE_USDC_DAI = new InterfaceTrade({
  v3Routes: [
    {
      routev3: new V3Route(
        [
          new Pool(
            USDC_MAINNET,
            DAI_MAINNET,
            FeeAmount.HIGH,
            '2437312313659959819381354528',
            '10272714736694327408',
            -69633
          ),
        ],
        USDC_MAINNET,
        DAI_MAINNET
      ),
      inputAmount: toCurrencyAmount(USDC_MAINNET, 1),
      outputAmount: toCurrencyAmount(DAI_MAINNET, 1),
    },
  ],
  v2Routes: [],
  tradeType: TradeType.EXACT_INPUT,
})

jest.mock('utils/switchChain')
const mockToggleAccountDrawer = jest.fn()
jest.mock('components/AccountDrawer', () => ({
  useToggleAccountDrawer: () => mockToggleAccountDrawer,
}))
jest.mock('hooks/useWrapCallback')
const mockUseWrapCallback = mocked(useWrapCallback) as jest.MockedFunction<typeof useWrapCallback>
jest.mock('lib/hooks/useCurrencyBalance')
const mockUseCurrencyBalances = mocked(useCurrencyBalances) as jest.MockedFunction<typeof useCurrencyBalances>
jest.mock('hooks/useBestTrade')
const mockUseBestTrade = mocked(useBestTrade) as jest.MockedFunction<typeof useBestTrade>
jest.mock('hooks/usePermit2Allowance')
const mockUsePermit2Allowance = mocked(usePermit2Allowance) as jest.MockedFunction<typeof usePermit2Allowance>
jest.mock('utils/prices')
const mockWarningSeverity = mocked(warningSeverity) as jest.MockedFunction<typeof warningSeverity>

describe('Swap Button', () => {
  beforeEach(() => {
    mockUseWrapCallback.mockClear()
    mockUseWrapCallback.mockReturnValue({
      wrapType: WrapType.NOT_APPLICABLE,
      inputError: undefined,
      execute: jest.fn(),
    })
    mockUseCurrencyBalances.mockClear()
    mockUseCurrencyBalances.mockReturnValue([
      CurrencyAmount.fromRawAmount(USDC_MAINNET, JSBI.BigInt('1000000000000000000')),
      CurrencyAmount.fromRawAmount(DAI_MAINNET, JSBI.BigInt('1000000000000000000')),
    ])
    mocked(useWeb3React).mockReturnValue({
      account: '0x8097eF8A44005Fb3e4F7251845Ad59542f8Bec7C',
      chainId: SupportedChainId.MAINNET,
    } as ReturnType<typeof useWeb3React>)
    mockUseBestTrade.mockClear()
    mockUseBestTrade.mockReturnValue({
      state: TradeState.VALID,
      trade: TEST_TRADE_USDC_DAI,
    })
    mockUsePermit2Allowance.mockClear()
    mockUsePermit2Allowance.mockReturnValue({
      state: AllowanceState.ALLOWED,
    })
    mockWarningSeverity.mockClear()
    mockWarningSeverity.mockReturnValue(0)
  })

  it('should render unsupported asset disabled button', () => {
    render(
      <DerivedSwapInfoContextProvider
        state={getSwapState(USDC_MAINNET.address, '0x4bf5dc91E2555449293D7824028Eb8Fe5879B689')} // on the "broken" list
        chainId={SupportedChainId.MAINNET}
      >
        <SwapButton onSwapClick={jest.fn()} chainId={SupportedChainId.MAINNET} />
      </DerivedSwapInfoContextProvider>
    )
    expect(screen.getByText('Unsupported Asset')).toBeInTheDocument()
    expect(screen.getByTestId('swap-button')).toBeDisabled()
  })

  it('should render Connect wallet button when not connected', () => {
    mocked(useWeb3React).mockReturnValue({ account: undefined } as ReturnType<typeof useWeb3React>)
    render(<SwapButton onSwapClick={jest.fn()} chainId={SupportedChainId.MAINNET} />)
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
    expect(screen.getByTestId('swap-button')).toBeEnabled()
    act(() => {
      screen.getByText('Connect Wallet').click()
    })
    expect(mockToggleAccountDrawer).toHaveBeenCalled()
  })

  it('should render switch chain button', () => {
    render(<SwapButton onSwapClick={jest.fn()} chainId={SupportedChainId.OPTIMISM} />)
    expect(screen.getByText('Connect to Optimism')).toBeInTheDocument()
    expect(screen.getByTestId('swap-button')).toBeEnabled()
    act(() => {
      screen.getByText('Connect to Optimism').click()
    })
    expect(switchChain).toHaveBeenCalled()
  })

  it('should render wrap button', () => {
    mockUseWrapCallback.mockReturnValue({
      wrapType: WrapType.WRAP,
      inputError: undefined,
      execute: jest.fn(),
    })
    mockUseCurrencyBalances.mockReturnValue([
      CurrencyAmount.fromRawAmount(nativeOnChain(SupportedChainId.MAINNET), JSBI.BigInt('1000000000000000000')),
      CurrencyAmount.fromRawAmount(WETH9[SupportedChainId.MAINNET], JSBI.BigInt('1000000000000000000')),
    ])
    render(
      <DerivedSwapInfoContextProvider
        state={getSwapState('ETH', WRAPPED_NATIVE_CURRENCY?.[SupportedChainId.MAINNET]?.address ?? '')}
        chainId={SupportedChainId.MAINNET}
      >
        <SwapButton onSwapClick={jest.fn()} chainId={SupportedChainId.MAINNET} />
      </DerivedSwapInfoContextProvider>
    )
    expect(screen.getByText('Wrap')).toBeInTheDocument()
    expect(screen.getByTestId('wrap-button')).toBeEnabled()
  })

  it('should render insufficient liquidity error button', () => {
    mockUseBestTrade.mockReturnValue({
      state: TradeState.VALID,
      trade: undefined, // no route
    })
    render(
      <DerivedSwapInfoContextProvider
        state={getSwapState(USDC_MAINNET.address, DAI_MAINNET.address)}
        chainId={SupportedChainId.MAINNET}
      >
        <SwapButton onSwapClick={jest.fn()} chainId={SupportedChainId.MAINNET} />
      </DerivedSwapInfoContextProvider>
    )
    expect(screen.getByText('Insufficient liquidity for this trade.')).toBeInTheDocument()
  })

  it('should render approval button', () => {
    const mockApprove = jest.fn()
    mockUsePermit2Allowance.mockReturnValue({
      state: AllowanceState.REQUIRED,
      token: USDC_MAINNET,
      isApprovalLoading: false,
      approveAndPermit: mockApprove,
    })
    render(
      <DerivedSwapInfoContextProvider
        state={getSwapState(USDC_MAINNET.address, DAI_MAINNET.address)}
        chainId={SupportedChainId.MAINNET}
      >
        <SwapButton onSwapClick={jest.fn()} chainId={SupportedChainId.MAINNET} />
      </DerivedSwapInfoContextProvider>
    )
    expect(screen.getByTestId('swap-approve-button')).toBeEnabled()
  })

  it('should render swap button', () => {
    render(
      <DerivedSwapInfoContextProvider
        state={getSwapState(USDC_MAINNET.address, DAI_MAINNET.address)}
        chainId={SupportedChainId.MAINNET}
      >
        <SwapButton onSwapClick={jest.fn()} chainId={SupportedChainId.MAINNET} />
      </DerivedSwapInfoContextProvider>
    )
    expect(screen.getByTestId('swap-button')).toBeEnabled()
    expect(screen.getByText('Review Swap')).toBeInTheDocument()
  })
})
