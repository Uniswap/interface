import { usePoolData } from 'graphql/thegraph/PoolData'
import Router from 'react-router-dom'
import { mocked } from 'test-utils/mocked'
import { render, screen, waitFor } from 'test-utils/render'

import PoolDetails from '.'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}))

jest.mock('graphql/thegraph/PoolData', () => {
  const originalModule = jest.requireActual('graphql/thegraph/PoolData')
  return {
    ...originalModule,
    usePoolData: jest.fn(),
  }
})

const validParams = { poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640', chainName: 'ethereum' }
const validPoolDataResponse = {
  data: {
    __typename: 'Pool' as const,
    id: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
    feeTier: '500',
    liquidity: '32118065613640312417',
    sqrtPrice: '1943494374075311739809880994923792',
    tick: '202163',
    token0: {
      __typename: 'Token' as const,
      id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: '6',
      derivedETH: '0.000602062055419695968472438533210813',
    },
    token1: {
      __typename: 'Token' as const,
      id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: '18',
      derivedETH: '1',
    },
    token0Price: '1661.85294822715829371652214854595',
    token1Price: '0.0006017379582632664031212782038199158',
    volumeUSD: '394920157156.0515346899898790592366',
    volumeToken0: '394894081779.781168',
    volumeToken1: '190965971.266407832255075308',
    txCount: '5406827',
    totalValueLockedToken0: '180078648.881221',
    totalValueLockedToken1: '142782.017882048454494774',
    totalValueLockedUSD: '417233634.1468435997761171520463339',
  },
  loading: false,
}

describe('PoolDetailsPage', () => {
  beforeEach(() => {
    jest.spyOn(Router, 'useParams').mockReturnValue(validParams)
    mocked(usePoolData).mockReturnValue(validPoolDataResponse)
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
    })
    render(<PoolDetails />)

    waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument()
    })
  })

  // TODO replace with loading skeleton when designed
  it('nothing displayed while data is loading', () => {
    mocked(usePoolData).mockReturnValue({ data: undefined, loading: true })
    render(<PoolDetails />)

    waitFor(() => {
      expect(screen.getByText(/not found/i)).not.toBeInTheDocument()
    })
  })

  it('pool header is displayed when data is received from thegraph', () => {
    render(<PoolDetails />)

    waitFor(() => {
      expect(screen.getByText(/Explore/i)).toBeInTheDocument()
      expect(screen.getByText(/Pool/i)).toBeInTheDocument()
      expect(screen.getByText(/USDC \/ WETH \(0x88e6...5640\)/i)).toBeInTheDocument()
    })
  })
})
