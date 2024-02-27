import { usePoolData } from 'graphql/data/pools/usePoolData'
import Router from 'react-router-dom'
import store from 'state'
import { addSerializedToken } from 'state/user/reducer'
import { mocked } from 'test-utils/mocked'
import { validParams, validPoolDataResponse } from 'test-utils/pools/fixtures'
import { render, screen, waitFor } from 'test-utils/render'

import PoolDetails from '.'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}))

jest.mock('graphql/data/pools/usePoolData', () => {
  const originalModule = jest.requireActual('graphql/data/pools/usePoolData')
  return {
    ...originalModule,
    usePoolData: jest.fn(),
  }
})

jest.mock('hooks/useColor', () => {
  const originalModule = jest.requireActual('hooks/useColor')
  return {
    ...originalModule,
    useColor: jest.fn().mockReturnValue('#FFFFFF'),
  }
})

describe('PoolDetailsPage', () => {
  beforeEach(() => {
    jest.spyOn(Router, 'useParams').mockReturnValue(validParams)
    mocked(usePoolData).mockReturnValue(validPoolDataResponse)
    store.dispatch(
      addSerializedToken({
        serializedToken: {
          chainId: 1,
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
        },
      })
    )
    store.dispatch(
      addSerializedToken({
        serializedToken: {
          chainId: 1,
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
        },
      })
    )
  })

  it('not found page displayed when given no poolAddress', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({ chainName: validParams.chainName })
    render(<PoolDetails />)

    waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument()
    })
  })

  it('not found page displayed when given no chainName', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({ poolAddress: validParams.poolAddress })
    render(<PoolDetails />)

    waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument()
    })
  })

  it('not found page displayed when given invalid chainName', () => {
    jest
      .spyOn(Router, 'useParams')
      .mockReturnValue({ poolAddress: validParams.poolAddress, chainName: 'invalid-chain' })
    render(<PoolDetails />)

    waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument()
    })
  })

  it('not found page displayed when given invalid pool address', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({ poolAddress: '0xFakeAddress', chainName: validParams.chainName })
    render(<PoolDetails />)

    waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument()
    })
  })

  it('not found page displayed when no data is received from thegraph', () => {
    mocked(usePoolData).mockReturnValue({
      data: undefined,
      loading: false,
      error: false,
    })
    render(<PoolDetails />)

    waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument()
    })
  })

  it('nothing displayed while data is loading', () => {
    mocked(usePoolData).mockReturnValue({
      data: undefined,
      loading: true,
      error: false,
    })
    render(<PoolDetails />)

    waitFor(() => {
      expect(screen.getByTestId('pdp-links-loading-skeleton')).toBeInTheDocument()
    })
  })
})
