import { render, act } from 'test-utils'
import Pool from '.'
import * as switchChain from 'utils/switchChain'
import * as useV3Positions from 'hooks/useV3Positions'
import { BrowserRouter as Router } from 'react-router-dom'

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

    act(() => {
      const { asFragment } = render(
        <Router>
          <Pool />
        </Router>
      )
      expect(asFragment()).toMatchSnapshot()
    })
  })

  it('renders empty positions card when on supported chain with no positions', () => {
    jest.spyOn(switchChain, 'isChainAllowed').mockReturnValue(true)
    jest.spyOn(useV3Positions, 'useV3Positions').mockImplementation(() => {
      return { loading: false, positions: undefined }
    })

    act(() => {
      const { asFragment } = render(
        <Router>
          <Pool />
        </Router>
      )
      expect(asFragment()).toMatchSnapshot()
    })
  })
})
