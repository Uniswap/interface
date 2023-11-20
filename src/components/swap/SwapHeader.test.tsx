import { ChainId } from '@uniswap/sdk-core'
import { Field } from 'state/swap/actions'
import { initialDerivedSwapInfo, SwapContext } from 'state/swap/SwapContext'
import { render, screen } from 'test-utils/render'

import { SwapTab } from './constants'
import SwapHeader from './SwapHeader'

jest.mock('../../featureFlags/flags/limits', () => ({ useLimitsEnabled: () => true }))

describe('SwapHeader.tsx', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(
      <SwapContext.Provider
        value={{
          state: {
            independentField: Field.INPUT,
            typedValue: '',
            recipient: '',
            [Field.INPUT]: {},
            [Field.OUTPUT]: {},
            currentTab: SwapTab.Swap,
          },
          prefilledState: {
            INPUT: {
              currencyId: undefined,
            },
            OUTPUT: {
              currencyId: undefined,
            },
          },
          chainId: ChainId.MAINNET,
          derivedSwapInfo: initialDerivedSwapInfo,
          dispatch: jest.fn(),
        }}
      >
        <SwapHeader />
      </SwapContext.Provider>
    )
    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByText('Swap')).toBeInTheDocument()
    expect(screen.getByText('Buy')).toBeInTheDocument()
    expect(screen.getByText('Limit')).toBeInTheDocument()
  })

  it('calls callback for switching tabs', () => {
    const onClickTab = jest.fn()
    render(
      <SwapContext.Provider
        value={{
          state: {
            independentField: Field.INPUT,
            typedValue: '',
            recipient: '',
            [Field.INPUT]: {},
            [Field.OUTPUT]: {},
            currentTab: SwapTab.Swap,
          },
          prefilledState: {
            INPUT: {
              currencyId: undefined,
            },
            OUTPUT: {
              currencyId: undefined,
            },
          },
          chainId: ChainId.MAINNET,
          derivedSwapInfo: initialDerivedSwapInfo,
          dispatch: onClickTab,
        }}
      >
        <SwapHeader />
      </SwapContext.Provider>
    )
    screen.getByText('Limit').click()
    expect(onClickTab).toHaveBeenCalledWith({ payload: { tab: 'limit' }, type: 'swap/setCurrentTab' })
  })
})
