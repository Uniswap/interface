import SwapHeader from 'components/swap/SwapHeader'
import { Dispatch, PropsWithChildren, SetStateAction } from 'react'
import { MultichainContext } from 'state/multichain/types'
import { CurrencyState, EMPTY_DERIVED_SWAP_INFO, SwapAndLimitContext, SwapContext } from 'state/swap/types'
import { act, render, screen } from 'test-utils/render'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapTab } from 'uniswap/src/types/screens/interface'

interface WrapperProps {
  setCurrentTab?: Dispatch<SetStateAction<SwapTab>>
  setCurrencyState?: Dispatch<SetStateAction<CurrencyState>>
  chainId?: UniverseChainId
}

function Wrapper(props: PropsWithChildren<WrapperProps>) {
  return (
    <MultichainContext.Provider
      value={{
        reset: jest.fn(),
        setSelectedChainId: jest.fn(),
        isMultichainContext: true,
        initialChainId: props.chainId ?? UniverseChainId.Mainnet,
        chainId: props.chainId ?? UniverseChainId.Mainnet,
        setIsUserSelectedToken: jest.fn(),
        isUserSelectedToken: false,
      }}
    >
      <SwapAndLimitContext.Provider
        value={{
          currencyState: { inputCurrency: undefined, outputCurrency: undefined },
          setCurrencyState: props.setCurrencyState ?? jest.fn(),
          prefilledState: {
            inputCurrency: undefined,
            outputCurrency: undefined,
          },

          currentTab: SwapTab.Swap,
          setCurrentTab: props.setCurrentTab ?? jest.fn(),
        }}
      >
        <SwapContext.Provider
          value={{
            derivedSwapInfo: EMPTY_DERIVED_SWAP_INFO,
            setSwapState: jest.fn(),
            swapState: {
              independentField: CurrencyField.INPUT,
              typedValue: '',
            },
          }}
        >
          {props.children}
        </SwapContext.Provider>
      </SwapAndLimitContext.Provider>
    </MultichainContext.Provider>
  )
}

describe('SwapHeader.tsx', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(
      <Wrapper>
        <SwapHeader compact={false} syncTabToUrl={false} />
      </Wrapper>,
    )
    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByText('Swap')).toBeInTheDocument()
    expect(screen.getByText('Buy')).toBeInTheDocument()
    expect(screen.getByText('Limit')).toBeInTheDocument()
  })

  it('calls callback for switching tabs', () => {
    const onClickTab = jest.fn()
    render(
      <Wrapper setCurrentTab={onClickTab}>
        <SwapHeader compact={false} syncTabToUrl={true} />
      </Wrapper>,
    )
    act(() => {
      screen.getByText('Limit').click()
    })
    expect(onClickTab).toHaveBeenCalledWith(SwapTab.Limit)
  })
})
