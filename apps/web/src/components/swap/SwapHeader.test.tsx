import { ChainId } from '@uniswap/sdk-core'
import { Dispatch, PropsWithChildren, SetStateAction } from 'react'
import { CurrencyState, EMPTY_DERIVED_SWAP_INFO, SwapAndLimitContext, SwapContext } from 'state/swap/SwapContext'
import { act, render, screen } from 'test-utils/render'

import { Field, SwapTab } from './constants'
import SwapHeader from './SwapHeader'

jest.mock('../../featureFlags/flags/limits', () => ({ useLimitsEnabled: () => true }))

interface WrapperProps {
  setCurrentTab?: Dispatch<SetStateAction<SwapTab>>
  setCurrencyState?: Dispatch<SetStateAction<CurrencyState>>
  chainId?: ChainId
}

function Wrapper(props: PropsWithChildren<WrapperProps>) {
  return (
    <SwapAndLimitContext.Provider
      value={{
        currencyState: { inputCurrency: undefined, outputCurrency: undefined },
        setCurrencyState: props.setCurrencyState ?? jest.fn(),
        prefilledState: {
          inputCurrency: undefined,
          outputCurrency: undefined,
        },
        chainId: props.chainId ?? ChainId.MAINNET,
        currentTab: SwapTab.Swap,
        setCurrentTab: props.setCurrentTab ?? jest.fn(),
      }}
    >
      <SwapContext.Provider
        value={{
          derivedSwapInfo: EMPTY_DERIVED_SWAP_INFO,
          setSwapState: jest.fn(),
          swapState: {
            independentField: Field.INPUT,
            typedValue: '',
          },
        }}
      >
        {props.children}
      </SwapContext.Provider>
    </SwapAndLimitContext.Provider>
  )
}

describe('SwapHeader.tsx', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(
      <Wrapper>
        <SwapHeader compact={false} syncTabToUrl={false} />
      </Wrapper>
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
      </Wrapper>
    )
    act(() => {
      screen.getByText('Limit').click()
    })
    expect(onClickTab).toHaveBeenCalledWith(SwapTab.Limit)
  })

  it('does not render when chain is not mainnet', () => {
    const onClickTab = jest.fn()
    render(
      <Wrapper setCurrentTab={onClickTab} chainId={ChainId.ARBITRUM_GOERLI}>
        <SwapHeader compact={false} syncTabToUrl={false} />
      </Wrapper>
    )
    expect(screen.queryByText('Limit')).toBeNull()
  })
})
