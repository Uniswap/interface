import { usePoolData } from 'graphql/thegraph/PoolData'
import Router from 'react-router-dom'
import { mocked } from 'test-utils/mocked'
import { validParams, validPoolDataResponse } from 'test-utils/pools/fixtures'
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
      error: false,
    })
    render(<PoolDetails />)

    waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument()
    })
  })

  // TODO replace with loading skeleton when designed
  it('nothing displayed while data is loading', () => {
    mocked(usePoolData).mockReturnValue({
      data: undefined,
      loading: true,
      error: false,
    })
    render(<PoolDetails />)

    waitFor(() => {
      expect(screen.getByText(/not found/i)).not.toBeInTheDocument()
    })
  })

  it('pool header is displayed when data is received from thegraph', () => {
    const { asFragment } = render(<PoolDetails />)
    expect(asFragment()).toMatchSnapshot()

    waitFor(() => {
      expect(screen.getByText(/Explore/i)).toBeInTheDocument()
      expect(screen.getByText(/Pool/i)).toBeInTheDocument()
      expect(screen.getByText(/USDC \/ WETH \(0x88e6...5640\)/i)).toBeInTheDocument()
    })
  })
})
