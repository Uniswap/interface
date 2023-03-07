import * as chains from 'constants/chains'
import * as useV3Positions from 'hooks/useV3Positions'
import { render, screen } from 'test-utils'

import Pool from '.'

jest.mock('@web3-react/core', () => {
  const web3React = jest.requireActual('@web3-react/core')
  return {
    ...web3React,
    useWeb3React: () => ({
      chainId: 1,
    }),
  }
})

describe('networks', () => {
  it('renders error card when unsupported chain is selected', () => {
    jest.spyOn(chains, 'isSupportedChain').mockReturnValue(false)
    jest.spyOn(useV3Positions, 'useV3Positions').mockImplementation(() => {
      return { loading: false, positions: undefined }
    })

    render(<Pool />)
    expect(screen.getByText('Your connected network is unsupported.')).toBeInTheDocument()
  })

  it('renders empty positions card when on supported chain with no positions', () => {
    jest.spyOn(chains, 'isSupportedChain').mockReturnValue(true)
    jest.spyOn(useV3Positions, 'useV3Positions').mockImplementation(() => {
      return { loading: false, positions: undefined }
    })

    render(<Pool />)
    expect(screen.getByText('Your active V3 liquidity positions will appear here.')).toBeInTheDocument()
  })
})
