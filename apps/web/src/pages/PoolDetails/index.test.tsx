import { usePoolData } from 'appGraphql/data/pools/usePoolData'
import PoolDetails from 'pages/PoolDetails'
import React from 'react'
import { useParams } from 'react-router'
import store from 'state'
import { mocked } from 'test-utils/mocked'
import { validParams, validPoolDataResponse } from 'test-utils/pools/fixtures'
import { act, render, waitFor } from 'test-utils/render'
import { dismissTokenWarning } from 'uniswap/src/features/tokens/warnings/slice/slice'
import { TokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/types'

// eslint-disable-next-line import/no-unused-modules, jest/no-export
export const mockNavigate = vi.fn()

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    default: actual,
    useParams: vi.fn(),
    useNavigate: () => mockNavigate,
  }
})

vi.mock('appGraphql/data/pools/usePoolData', async () => {
  const actual = await vi.importActual('appGraphql/data/pools/usePoolData')
  return {
    ...actual,
    usePoolData: vi.fn(),
  }
})

vi.mock('hooks/useColor', async () => {
  const actual = await vi.importActual('hooks/useColor')
  return {
    ...actual,
    useColor: vi.fn().mockReturnValue('#FFFFFF'),
  }
})

vi.mock('pages/Swap', () => ({
  default: () => React.createElement(React.Fragment),
}))

describe('PoolDetailsPage', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    mocked(useParams).mockReturnValue(validParams)
    mocked(usePoolData).mockReturnValue(validPoolDataResponse)
    store.dispatch(
      dismissTokenWarning({
        token: {
          chainId: 1,
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
        },
        warning: TokenProtectionWarning.NonDefault,
      }),
    )
    store.dispatch(
      dismissTokenWarning({
        token: {
          chainId: 1,
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
        },
        warning: TokenProtectionWarning.NonDefault,
      }),
    )
  })

  it('navigates to not found page when given no poolAddress', async () => {
    mocked(useParams).mockReturnValue({ chainName: validParams.chainName })
    render(<PoolDetails />)

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1))
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/explore/pools?type=pools&result=not-found')
    })
  })

  it('navigates to not found page when given no chainName', async () => {
    mocked(useParams).mockReturnValue({ poolAddress: validParams.poolAddress })
    render(<PoolDetails />)

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1))
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/explore/pools?type=pools&result=not-found')
    })
  })

  it('navigates to not found page when given invalid chainName', async () => {
    mocked(useParams).mockReturnValue({ poolAddress: validParams.poolAddress, chainName: 'invalid-chain' })
    render(<PoolDetails />)

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1))
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/explore/pools?type=pools&result=not-found')
    })
  })

  it('navigates to not found page when no data is received from backend', async () => {
    mocked(usePoolData).mockReturnValue({
      data: undefined,
      loading: false,
      error: false,
    })
    render(<PoolDetails />)

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1))
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/explore/pools?type=pools&result=not-found')
    })
  })
})
