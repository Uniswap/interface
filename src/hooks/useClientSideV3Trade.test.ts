import { renderHook } from '@testing-library/react'
import { CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Route } from '@uniswap/v3-sdk'
import { DAI, USDC_MAINNET } from 'constants/tokens'
import { useAllV3Routes } from 'hooks/useAllV3Routes'
import { useSingleContractWithCallData } from 'lib/hooks/multicall'

import { useClientSideV3Trade } from './useClientSideV3Trade'
import { useQuoter } from './useContract'

const USDCAmount = CurrencyAmount.fromRawAmount(USDC_MAINNET, '10000')
const mockPool = new Pool(
  USDC_MAINNET,
  DAI,
  FeeAmount.MEDIUM,
  '2437312313659959819381354528',
  '10272714736694327408',
  -69633
)
const mockRoute = new Route([mockPool], USDC_MAINNET, DAI)

jest.mock('./useAllV3Routes')
jest.mock('./useContract')
jest.mock('lib/hooks/multicall')

jest.mock('@web3-react/core', () => {
  const original = jest.requireActual('@web3-react/core')
  return {
    ...original,
    useWeb3React: () => ({
      chainId: 1,
    }),
  }
})

const mockQuoteCallParameters = jest.fn()
jest.mock('@uniswap/v3-sdk', () => {
  const original = jest.requireActual('@uniswap/v3-sdk')
  return {
    ...original,
    SwapQuoter: {
      quoteCallParameters() {
        // eslint-disable-next-line prefer-rest-params
        return mockQuoteCallParameters(...arguments)
      },
    },
  }
})

const mockUseAllV3Routes = useAllV3Routes as jest.MockedFunction<typeof useAllV3Routes>
const mockUseContract = useQuoter as jest.MockedFunction<typeof useQuoter>
const mockUseSingleContractWithCallData = useSingleContractWithCallData as jest.MockedFunction<
  typeof useSingleContractWithCallData
>

describe('#useClientSideV3Trade ExactIn', () => {
  it('calls the SwapQuoter with QuoterV2', async () => {
    mockQuoteCallParameters.mockImplementation(() => {
      return {
        calldata: '0x',
        value: '0',
      }
    })

    const tradeType = TradeType.EXACT_INPUT

    mockUseAllV3Routes.mockReturnValue({
      loading: false,
      routes: [mockRoute],
    })
    mockUseContract.mockReturnValue(null)
    mockUseSingleContractWithCallData.mockReturnValue([])

    renderHook(() => useClientSideV3Trade(tradeType, USDCAmount, DAI))

    expect(mockQuoteCallParameters).toHaveBeenCalledTimes(1)
    expect(mockQuoteCallParameters).toHaveBeenCalledWith(mockRoute, USDCAmount, tradeType, {
      useQuoterV2: true,
    })
  })
})

describe('#useClientSideV3Trade ExactOut', () => {
  it('calls the SwapQuoter with QuoterV2', async () => {
    mockQuoteCallParameters.mockImplementation(() => {
      return {
        calldata: '0x',
        value: '0',
      }
    })
    const tradeType = TradeType.EXACT_OUTPUT
    mockUseAllV3Routes.mockReturnValue({
      loading: false,
      routes: [mockRoute],
    })
    mockUseContract.mockReturnValue(null)
    mockUseSingleContractWithCallData.mockReturnValue([])

    renderHook(() => useClientSideV3Trade(tradeType, USDCAmount, DAI))

    expect(mockQuoteCallParameters).toHaveBeenCalledTimes(1)
    expect(mockQuoteCallParameters).toHaveBeenCalledWith(mockRoute, USDCAmount, tradeType, {
      useQuoterV2: true,
    })
  })
})
