import { ChainId } from '@uniswap/sdk-core'
import { PropsWithChildren } from 'react'
import { EMPTY_DERIVED_SWAP_INFO, SwapContext } from 'state/swap/SwapContext'
import { render, screen } from 'test-utils/render'

import { Field, SwapTab } from './constants'
import SwapHeader from './SwapHeader'

jest.mock('../../featureFlags/flags/limits', () => ({ useLimitsEnabled: () => true }))

interface WrapperProps {
  setCurrentTab?: (tab: SwapTab) => void
}

function Wrapper(props: PropsWithChildren<WrapperProps>) {
  return (
    <SwapContext.Provider
      value={{
        currentTab: SwapTab.Swap,
        setCurrentTab: props.setCurrentTab ?? jest.fn(),
        chainId: ChainId.MAINNET,
        derivedSwapInfo: EMPTY_DERIVED_SWAP_INFO,
        setSwapState: jest.fn(),
        swapState: {
          independentField: Field.INPUT,
          typedValue: '',
          recipient: '',
          inputCurrencyId: undefined,
          outputCurrencyId: undefined,
        },
        prefilledState: {
          inputCurrencyId: undefined,
          outputCurrencyId: undefined,
        },
      }}
    >
      {props.children}
    </SwapContext.Provider>
  )
}

describe('SwapHeader.tsx', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(
      <Wrapper>
        <SwapHeader />
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
        <SwapHeader />
      </Wrapper>
    )
    screen.getByText('Limit').click()
    expect(onClickTab).toHaveBeenCalledWith(SwapTab.Limit)
  })
})
