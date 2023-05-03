import React from 'react'
import { NetworkFee } from 'src/components/Network/NetworkFee'
import { render } from 'src/test/test-utils'
import { ChainId } from 'wallet/src/constants/chains'

jest.mock('src/features/wallet/hooks', () => {
  return {
    useActiveAccount: (): undefined => undefined,
  }
})

jest.mock('src/features/experiments/hooks', () => {
  return {
    useFeatureFlag: (): undefined => undefined,
  }
})

describe(NetworkFee, () => {
  it('renders a NetworkFee normally', () => {
    const tree = render(<NetworkFee chainId={ChainId.Mainnet} gasFee="420000" />)
    expect(tree).toMatchSnapshot()
  })

  it('renders a NetworkFee in a loading state', () => {
    const tree = render(<NetworkFee chainId={ChainId.Mainnet} gasFallbackUsed={false} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders a NetworkFee with a warning', () => {
    const tree = render(
      <NetworkFee chainId={ChainId.Mainnet} gasFallbackUsed={true} gasFee="420000" />
    )
    expect(tree).toMatchSnapshot()
  })
})
