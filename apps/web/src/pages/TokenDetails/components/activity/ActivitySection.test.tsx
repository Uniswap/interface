import { screen } from '@testing-library/react'
import { Token } from '@uniswap/sdk-core'
import * as chainsUtils from 'uniswap/src/features/platforms/utils/chains'
import { ActivitySection } from '~/pages/TokenDetails/components/activity/ActivitySection'
import { render } from '~/test-utils/render'

const mockToken = new Token(1, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', 18, 'WETH', 'Wrapped Ether')

vi.mock('uniswap/src/features/platforms/utils/chains')

vi.mock('~/pages/TokenDetails/hooks/useTDPEffectiveCurrency', () => ({
  useTDPEffectiveCurrency: () => mockToken,
}))

vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({
  useTDPStore: (
    selector: (s: { currency: Token; currencyChainId: number; selectedMultichainChainId: undefined }) => unknown,
  ) => selector({ currency: mockToken, currencyChainId: mockToken.chainId, selectedMultichainChainId: undefined }),
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
