import 'test-utils/tokens/mocks'

import { BigNumber } from '@ethersproject/bignumber'
import { CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { UNIVERSAL_ROUTER_ADDRESS, UniversalRouterVersion } from '@uniswap/universal-router-sdk'
import { getURAddress, useNftUniversalRouterAddress } from 'graphql/data/nft/NftUniversalRouterAddress'
import { useAccount } from 'hooks/useAccount'
import usePermit2Allowance, { AllowanceState } from 'hooks/usePermit2Allowance'
import useCurrencyBalance, { useTokenBalance } from 'lib/hooks/useCurrencyBalance'
import { BagFooter } from 'nft/components/bag/BagFooter'
import { useBag } from 'nft/hooks'
import { useBagTotalEthPrice } from 'nft/hooks/useBagTotalEthPrice'
import useDerivedPayWithAnyTokenSwapInfo from 'nft/hooks/useDerivedPayWithAnyTokenSwapInfo'
import usePayWithAnyTokenSwap from 'nft/hooks/usePayWithAnyTokenSwap'
import { usePriceImpact } from 'nft/hooks/usePriceImpact'
import { useTokenInput } from 'nft/hooks/useTokenInput'
import { BagStatus } from 'nft/types'
import { TradeState } from 'state/routing/types'
import { TEST_TOKEN_1, TEST_TRADE_EXACT_INPUT, USE_CONNECTED_ACCOUNT, toCurrencyAmount } from 'test-utils/constants'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

jest.mock('hooks/useAccount', () => ({
  useAccount: jest.fn(),
}))

jest.mock('nft/hooks/useBagTotalEthPrice')
jest.mock('nft/hooks/useBag')
jest.mock('nft/hooks/useTokenInput')
jest.mock('lib/hooks/useCurrencyBalance')
jest.mock('nft/hooks/usePayWithAnyTokenSwap')
jest.mock('nft/hooks/useDerivedPayWithAnyTokenSwapInfo')
jest.mock('graphql/data/nft/NftUniversalRouterAddress', () => {
  const originalModule = jest.requireActual('graphql/data/nft/NftUniversalRouterAddress')
  return {
    ...originalModule,
    useNftUniversalRouterAddress: jest.fn(),
  }
})
jest.mock('hooks/usePermit2Allowance')
jest.mock('nft/hooks/usePriceImpact')
jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

const renderBagFooter = () => {
  render(<BagFooter setModalIsOpen={() => undefined} eventProperties={{}} />)
}

const getBuyButton = () => screen.queryByTestId('nft-buy-button') as HTMLButtonElement
const getBuyButtonWarning = () => screen.queryByTestId('nft-buy-button-warning') as HTMLDivElement

describe('BagFooter.tsx', () => {
  beforeEach(() => {
    mocked(useAccount).mockReturnValue(USE_CONNECTED_ACCOUNT)

    mocked(useBag).mockReturnValue({
      bagStatus: BagStatus.ADDING_TO_BAG,
      setBagStatus: () => undefined,
      setBagExpanded: () => undefined,
      isLocked: false,
      itemsInBag: [],
    }) as ReturnType<typeof useBag>
    mocked(useBagTotalEthPrice).mockReturnValue(BigNumber.from(12))
    mocked(useCurrencyBalance).mockReturnValue(
      CurrencyAmount.fromRawAmount(nativeOnChain(UniverseChainId.Mainnet), 100),
    )

    mocked(usePermit2Allowance).mockReturnValue({
      state: AllowanceState.ALLOWED,
      permitSignature: undefined,
    })
    mocked(useNftUniversalRouterAddress).mockReturnValue({
      universalRouterAddress: undefined,
      universalRouterAddressIsLoading: false,
    })

    mocked(usePriceImpact).mockReturnValue(undefined)

    mocked(useDerivedPayWithAnyTokenSwapInfo).mockReturnValue({
      state: TradeState.INVALID,
      trade: undefined,
      maximumAmountIn: undefined,
      allowedSlippage: new Percent(10, 100),
    })
    mocked(usePayWithAnyTokenSwap).mockReturnValue()
    mocked(useTokenInput).mockReturnValue({
      inputCurrency: undefined,
      setInputCurrency: () => undefined,
      clearInputCurrency: () => undefined,
      tokenTradeInput: undefined,
      setTokenTradeInput: () => undefined,
    })
    mocked(useTokenBalance).mockReturnValue(undefined)
  })

  it('pay', () => {
    renderBagFooter()
    const buyButton = getBuyButton()

    expect(buyButton).toBeInTheDocument()
    expect(buyButton.textContent).toBe('Pay')
    expect(buyButton.style.opacity).toBe('1')
  })

  it('wallet not connected', () => {
    mocked(useAccount).mockReturnValue({
      chainId: 1,
      address: undefined,
    } as ReturnType<typeof useAccount>)

    renderBagFooter()
    const buyButton = getBuyButton()

    expect(buyButton).toBeInTheDocument()
    expect(buyButton.textContent).toBe('Connect wallet')
    expect(buyButton.style.opacity).toBe('1')
  })

  it('connected to wrong network', () => {
    mocked(useAccount).mockReturnValue({
      ...USE_CONNECTED_ACCOUNT,
      chainId: 2,
    } as unknown as ReturnType<typeof useAccount>)

    renderBagFooter()
    const buyButton = getBuyButton()

    expect(buyButton.textContent).toBe('Switch networks')
    expect(buyButton.style.opacity).toBe('1')
  })

  it('insufficient balance', () => {
    mocked(useCurrencyBalance).mockReturnValue(CurrencyAmount.fromRawAmount(nativeOnChain(UniverseChainId.Mainnet), 0))

    renderBagFooter()
    const buyButton = getBuyButton()
    const buyButtonWarning = getBuyButtonWarning()

    expect(buyButtonWarning.textContent).toBe('Insufficient funds')
    expect(buyButton.style.opacity).toBe('0.6')
  })

  it('transaction error', () => {
    mocked(useBag).mockReturnValue({
      bagStatus: BagStatus.WARNING,
      setBagStatus: () => undefined,
      setBagExpanded: () => undefined,
      isLocked: false,
      itemsInBag: [],
    } as ReturnType<typeof useBag>)

    renderBagFooter()
    const buyButtonWarning = getBuyButtonWarning()
    const buyButton = getBuyButton()

    expect(buyButtonWarning.textContent).toBe('Something went wrong. Please try again.')
    expect(buyButton.style.opacity).toBe('0.6')
  })

  it('is in wallet confirmation for fetching route', () => {
    mocked(useBag).mockReturnValue({
      bagStatus: BagStatus.FETCHING_FINAL_ROUTE,
      setBagStatus: () => undefined,
      setBagExpanded: () => undefined,
      isLocked: false,
      itemsInBag: [],
    } as ReturnType<typeof useBag>)

    renderBagFooter()
    const buyButton = getBuyButton()

    expect(buyButton.textContent).toBe('Proceed in wallet')
    expect(buyButton.style.opacity).toBe('0.6')
  })

  it('is in wallet confirmation for confirming in wallet', () => {
    mocked(useBag).mockReturnValue({
      bagStatus: BagStatus.CONFIRMING_IN_WALLET,
      setBagStatus: () => undefined,
      setBagExpanded: () => undefined,
      isLocked: false,
      itemsInBag: [],
    }) as ReturnType<typeof useBag>

    renderBagFooter()
    const buyButton = getBuyButton()

    expect(buyButton.textContent).toBe('Proceed in wallet')
    expect(buyButton.style.opacity).toBe('0.6')
  })

  it('is in pending state while transaction pending', () => {
    mocked(useBag).mockReturnValue({
      bagStatus: BagStatus.PROCESSING_TRANSACTION,
      setBagStatus: () => undefined,
      setBagExpanded: () => undefined,
      isLocked: false,
      itemsInBag: [],
    }) as ReturnType<typeof useBag>

    renderBagFooter()
    const buyButton = getBuyButton()

    expect(buyButton.textContent).toBe('Transaction pending')
    expect(buyButton.style.opacity).toBe('0.6')
  })

  it('insufficient funds for token trade', () => {
    mocked(useTokenInput).mockReturnValue({
      inputCurrency: TEST_TOKEN_1,
      setInputCurrency: () => undefined,
      clearInputCurrency: () => undefined,
      tokenTradeInput: undefined,
      setTokenTradeInput: () => undefined,
    })
    mocked(useTokenBalance).mockReturnValue(toCurrencyAmount(TEST_TOKEN_1, 20))
    mocked(useDerivedPayWithAnyTokenSwapInfo).mockReturnValue({
      state: TradeState.INVALID,
      trade: TEST_TRADE_EXACT_INPUT,
      maximumAmountIn: undefined,
      allowedSlippage: new Percent(10, 100),
    })

    renderBagFooter()
    const buyButton = getBuyButton()
    const buyButtonWarning = getBuyButtonWarning()

    expect(buyButtonWarning.textContent).toBe('Insufficient funds')
    expect(buyButton.style.opacity).toBe('0.6')
  })

  it('invalid token trade', () => {
    mocked(useTokenInput).mockReturnValue({
      inputCurrency: TEST_TOKEN_1,
      setInputCurrency: () => undefined,
      clearInputCurrency: () => undefined,
      tokenTradeInput: undefined,
      setTokenTradeInput: () => undefined,
    })
    mocked(useTokenBalance).mockReturnValue(toCurrencyAmount(TEST_TOKEN_1, 1000))
    mocked(useDerivedPayWithAnyTokenSwapInfo).mockReturnValue({
      state: TradeState.INVALID,
      trade: TEST_TRADE_EXACT_INPUT,
      maximumAmountIn: undefined,
      allowedSlippage: new Percent(10, 100),
    })

    renderBagFooter()
    const buyButton = getBuyButton()
    expect(buyButton.textContent).toBe('Pay')
    expect(buyButton.style.opacity).toBe('0.6')
  })

  it('no token route found', () => {
    mocked(useTokenInput).mockReturnValue({
      inputCurrency: TEST_TOKEN_1,
      setInputCurrency: () => undefined,
      clearInputCurrency: () => undefined,
      tokenTradeInput: undefined,
      setTokenTradeInput: () => undefined,
    })
    mocked(useTokenBalance).mockReturnValue(toCurrencyAmount(TEST_TOKEN_1, 1000))
    mocked(useDerivedPayWithAnyTokenSwapInfo).mockReturnValue({
      state: TradeState.NO_ROUTE_FOUND,
      trade: TEST_TRADE_EXACT_INPUT,
      maximumAmountIn: undefined,
      allowedSlippage: new Percent(10, 100),
    })

    renderBagFooter()
    const buyButton = getBuyButton()
    expect(buyButton.textContent).toBe('Insufficient liquidity')
    expect(buyButton.style.opacity).toBe('0.6')
  })

  it('fetching token route', () => {
    mocked(useTokenInput).mockReturnValue({
      inputCurrency: TEST_TOKEN_1,
      setInputCurrency: () => undefined,
      clearInputCurrency: () => undefined,
      tokenTradeInput: undefined,
      setTokenTradeInput: () => undefined,
    })
    mocked(useTokenBalance).mockReturnValue(toCurrencyAmount(TEST_TOKEN_1, 1000))
    mocked(useDerivedPayWithAnyTokenSwapInfo).mockReturnValue({
      state: TradeState.LOADING,
      trade: TEST_TRADE_EXACT_INPUT,
      maximumAmountIn: undefined,
      allowedSlippage: new Percent(10, 100),
    })

    renderBagFooter()
    const buyButton = getBuyButton()
    expect(buyButton.textContent).toBe('Fetching route')
    expect(buyButton.style.opacity).toBe('0.6')
  })

  it('confirm price change', () => {
    mocked(useBag).mockReturnValue({
      bagStatus: BagStatus.CONFIRM_QUOTE,
      setBagStatus: () => undefined,
      setBagExpanded: () => undefined,
      isLocked: false,
      itemsInBag: [],
    }) as ReturnType<typeof useBag>

    renderBagFooter()
    const buyButton = getBuyButton()

    expect(buyButton.textContent).toBe('Pay')
    expect(buyButton.style.opacity).toBe('1')
  })

  it('loading allowance', () => {
    mocked(usePermit2Allowance).mockReturnValue({
      state: AllowanceState.LOADING,
    })

    renderBagFooter()
    const buyButton = getBuyButton()

    expect(buyButton.textContent).toBe('Loading allowance')
    expect(buyButton.style.opacity).toBe('0.6')
  })

  it('approval is loading', () => {
    mocked(usePermit2Allowance).mockReturnValue({
      state: AllowanceState.REQUIRED,
      isApprovalLoading: true,
      isApprovalPending: false,
      token: TEST_TOKEN_1,
      approveAndPermit: () => Promise.resolve(),
      approve: () => Promise.resolve(),
      permit: () => Promise.resolve(),
      revoke: () => Promise.resolve(),
      needsSetupApproval: false,
      needsPermitSignature: false,
      isRevocationPending: false,
      allowedAmount: CurrencyAmount.fromRawAmount(TEST_TOKEN_1, 0),
    })

    renderBagFooter()
    const buyButton = getBuyButton()

    expect(buyButton.textContent).toBe('Approval pending')
    expect(buyButton.style.opacity).toBe('0.6')
  })

  it('allowance to be confirmed in wallet', () => {
    mocked(usePermit2Allowance).mockReturnValue({
      state: AllowanceState.REQUIRED,
      isApprovalLoading: false,
      isApprovalPending: true,
      token: TEST_TOKEN_1,
      approveAndPermit: () => Promise.resolve(),
      approve: () => Promise.resolve(),
      permit: () => Promise.resolve(),
      revoke: () => Promise.resolve(),
      needsSetupApproval: false,
      needsPermitSignature: false,
      isRevocationPending: false,
      allowedAmount: CurrencyAmount.fromRawAmount(TEST_TOKEN_1, 0),
    })

    renderBagFooter()
    const buyButton = getBuyButton()

    expect(buyButton.textContent).toBe('Approve in your wallet')
    expect(buyButton.style.opacity).toBe('0.6')
  })

  it('approve', () => {
    mocked(usePermit2Allowance).mockReturnValue({
      state: AllowanceState.REQUIRED,
      isApprovalLoading: false,
      isApprovalPending: false,
      token: TEST_TOKEN_1,
      approveAndPermit: () => Promise.resolve(),
      approve: () => Promise.resolve(),
      permit: () => Promise.resolve(),
      revoke: () => Promise.resolve(),
      needsSetupApproval: false,
      needsPermitSignature: false,
      isRevocationPending: false,
      allowedAmount: CurrencyAmount.fromRawAmount(TEST_TOKEN_1, 0),
    })

    renderBagFooter()
    const buyButton = getBuyButton()

    expect(buyButton.textContent).toBe('Approve')
    expect(buyButton.style.opacity).toBe('1')
  })

  it('price impact high', () => {
    mocked(usePriceImpact).mockReturnValue({
      priceImpactSeverity: {
        type: 'error',
        color: 'accentCritical',
      },
      displayPercentage: () => '5%',
    })

    renderBagFooter()
    const buyButton = getBuyButton()

    expect(buyButton.textContent).toBe('Pay Anyway')
    expect(buyButton.style.opacity).toBe('1')
  })

  it('should use the correct UR address', () => {
    expect(getURAddress(undefined)).toBe(undefined)
    expect(getURAddress(UniverseChainId.Mainnet)).toBe(
      UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, UniverseChainId.Mainnet),
    )
    expect(getURAddress(UniverseChainId.Mainnet, 'test_nft_ur_address')).toBe('test_nft_ur_address')
    expect(getURAddress(UniverseChainId.Optimism)).toBe(
      UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, UniverseChainId.Optimism),
    )
  })
})
