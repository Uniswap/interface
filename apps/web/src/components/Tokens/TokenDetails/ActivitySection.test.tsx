import { screen } from '@testing-library/react'
import { Token } from '@uniswap/sdk-core'
import { ActivitySection } from 'components/Tokens/TokenDetails/ActivitySection'
import { render } from 'test-utils/render'
import * as chainsUtils from 'uniswap/src/features/platforms/utils/chains'

const mockToken = new Token(1, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', 18, 'WETH', 'Wrapped Ether')

vi.mock('uniswap/src/features/platforms/utils/chains')

vi.mock('pages/TokenDetails/TDPContext', () => ({
  useTDPContext: () => {
    return {
      currency: mockToken,
      currencyChainId: mockToken.chainId,
    }
  },
}))

describe('ActivitySection', () => {
  it('has Pools and Transactions tabs for EVM chains', () => {
    vi.mocked(chainsUtils.isSVMChain).mockReturnValue(false)

    render(<ActivitySection />)

    expect(screen.getByText('Pools')).toBeInTheDocument()
    expect(screen.getByText('Transactions')).toBeInTheDocument()
  })

  it('only has Transactions tab for SVM chains', () => {
    vi.mocked(chainsUtils.isSVMChain).mockReturnValue(true)

    render(<ActivitySection />)

    expect(screen.queryByText('Pools')).not.toBeInTheDocument()
    expect(screen.getByText('Transactions')).toBeInTheDocument()
  })
})
