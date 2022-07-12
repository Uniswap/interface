import * as useV3Positions from 'hooks/useV3Positions'
import { BrowserRouter as Router } from 'react-router-dom'
import { render, screen } from 'test-utils'
import * as switchChain from 'utils/switchChain'

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
    jest.spyOn(switchChain, 'isChainAllowed').mockReturnValue(false)
    jest.spyOn(useV3Positions, 'useV3Positions').mockImplementation(() => {
      return { loading: false, positions: undefined }
    })

    render(
      <Router>
        <Pool />
      </Router>
    )
    expect(
      screen.getByText('Your connected network is unsupported. Request support', { exact: false })
    ).toBeInTheDocument()
  })

  it('renders empty positions card when on supported chain with no positions', () => {
    jest.spyOn(switchChain, 'isChainAllowed').mockReturnValue(true)
    jest.spyOn(useV3Positions, 'useV3Positions').mockImplementation(() => {
      return { loading: false, positions: undefined }
    })

    render(
      <Router>
        <Pool />
      </Router>
    )
    expect(screen.getByText('Your active V3 liquidity positions will appear here.')).toBeInTheDocument()
  })
})
