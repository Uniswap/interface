import { BigNumber } from '@ethersproject/bignumber'
import { parseEther } from '@ethersproject/units'
import { Currency, Percent, SupportedChainId } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { nativeOnChain } from 'constants/tokens'
import { useCurrency } from 'hooks/Tokens'
import { useTokenBalance } from 'lib/hooks/useCurrencyBalance'
import { useBag, useWalletBalance } from 'nft/hooks'
import { useBagTotalEthPrice } from 'nft/hooks/useBagTotalEthPrice'
import useDerivedPayWithAnyTokenSwapInfo from 'nft/hooks/useDerivedPayWithAnyTokenSwapInfo'
import usePayWithAnyTokenSwap from 'nft/hooks/usePayWithAnyTokenSwap'
import { useTokenInput } from 'nft/hooks/useTokenInput'
import { BagStatus } from 'nft/types'
import { TradeState } from 'state/routing/types'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'

import { BagFooter } from './BagFooter'

jest.mock('nft/hooks/useBagTotalEthPrice')
jest.mock('nft/hooks/useWalletBalance')
jest.mock('nft/hooks/useBag')
jest.mock('nft/hooks/useTokenInput')
jest.mock('lib/hooks/useCurrencyBalance')
jest.mock('hooks/Tokens')
jest.mock('nft/hooks/usePayWithAnyTokenSwap')
jest.mock('nft/hooks/useDerivedPayWithAnyTokenSwapInfo')
jest.mock(
  'components/Logo/CurrencyLogo',
  () =>
    ({ currency }: { currency: Currency }) =>
      `CurrencyLogo currency=${currency.symbol}`
)

const renderBagFooter = () => {
  render(<BagFooter setModalIsOpen={() => undefined} eventProperties={{}} />)
}

const getBuyButton = () => screen.queryByTestId('nft-buy-button') as HTMLButtonElement
const getBuyButtonWarning = () => screen.queryByTestId('nft-buy-button-warning') as HTMLDivElement

describe('BagFooter.tsx', () => {
  beforeEach(() => {
    mocked(useWeb3React).mockReturnValue({
      chainId: 1,
      account: '0x52270d8234b864dcAC9947f510CE9275A8a116Db',
    } as ReturnType<typeof useWeb3React>)

    mocked(useBagTotalEthPrice).mockReturnValue(BigNumber.from(12))
    mocked(useWalletBalance).mockReturnValue({
      address: '',
      balance: '100',
      weiBalance: parseEther('0'),
      provider: undefined,
    })

    mocked(useBag).mockReturnValue({
      bagStatus: BagStatus.ADDING_TO_BAG,
      setBagStatus: () => undefined,
      setBagExpanded: () => undefined,
      isLocked: false,
      itemsInBag: [],
    }) as ReturnType<typeof useBag>

    mocked(useDerivedPayWithAnyTokenSwapInfo).mockReturnValue({
      state: TradeState.INVALID,
      trade: undefined,
      maximumAmountIn: undefined,
      allowedSlippage: new Percent(10, 100),
    })
    mocked(usePayWithAnyTokenSwap).mockReturnValue()
    mocked(useCurrency).mockReturnValue(nativeOnChain(SupportedChainId.MAINNET))
    mocked(useTokenInput).mockReturnValue({
      inputCurrency: undefined,
      setInputCurrency: () => undefined,
      clearInputCurrency: () => undefined,
      tokenTradeInput: undefined,
      setTokenTradeInput: () => undefined,
    })
    mocked(useTokenBalance).mockReturnValue(undefined)
  })

  it('wallet not connected', () => {
    mocked(useWeb3React).mockReturnValue({
      chainId: 1,
      account: undefined,
    } as ReturnType<typeof useWeb3React>)

    renderBagFooter()
    const buyButton = getBuyButton()

    expect(buyButton).toBeInTheDocument()
    expect(buyButton.textContent).toBe('Connect wallet')
    expect(buyButton).not.toBeDisabled()
  })

  it('connected to wrong network', () => {
    mocked(useWeb3React).mockReturnValue({
      chainId: 2,
      account: '0x52270d8234b864dcAC9947f510CE9275A8a116Db',
    } as ReturnType<typeof useWeb3React>)

    renderBagFooter()
    const buyButton = getBuyButton()

    expect(buyButton.textContent).toBe('Switch networks')
    expect(buyButton).not.toBeDisabled()
  })

  it('insufficient balance', () => {
    mocked(useWalletBalance).mockReturnValue({
      address: '',
      balance: '0',
      weiBalance: parseEther('0'),
      provider: undefined,
    })

    renderBagFooter()
    const buyButton = getBuyButton()
    const buyButtonWarning = getBuyButtonWarning()

    expect(buyButtonWarning.textContent).toBe('Insufficient funds')
    expect(buyButton).toBeDisabled()
  })

  it('transaction error', () => {
    mocked(useBag).mockReturnValue({
      bagStatus: BagStatus.WARNING,
      setBagStatus: () => undefined,
      setBagExpanded: () => undefined,
      isLocked: false,
      itemsInBag: [],
    }) as ReturnType<typeof useBag>

    renderBagFooter()
    const buyButtonWarning = getBuyButtonWarning()
    const buyButton = getBuyButton()

    expect(buyButtonWarning.textContent).toBe('Something went wrong. Please try again.')
    expect(buyButton).toBeDisabled()
  })

  it('is in wallet confirmation for fetching route', () => {
    mocked(useBag).mockReturnValue({
      bagStatus: BagStatus.FETCHING_FINAL_ROUTE,
      setBagStatus: () => undefined,
      setBagExpanded: () => undefined,
      isLocked: false,
      itemsInBag: [],
    }) as ReturnType<typeof useBag>

    renderBagFooter()
    const buyButton = getBuyButton()

    expect(buyButton.textContent).toBe('Proceed in wallet')
    expect(buyButton).toBeDisabled()
  })

  it('is in wallet confirmation for confirming in wallet', () => {
    mocked(useBag).mockReturnValue({
      bagStatus: BagStatus.FETCHING_FINAL_ROUTE,
      setBagStatus: () => undefined,
      setBagExpanded: () => undefined,
      isLocked: false,
      itemsInBag: [],
    }) as ReturnType<typeof useBag>

    renderBagFooter()
    const buyButton = getBuyButton()

    expect(buyButton.textContent).toBe('Proceed in wallet')
    expect(buyButton).toBeDisabled()
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
    expect(buyButton).toBeDisabled()
  })
})
