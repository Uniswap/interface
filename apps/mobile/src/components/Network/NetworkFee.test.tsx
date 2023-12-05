import React from 'react'
import { NetworkFee } from 'src/components/Network/NetworkFee'
import { render } from 'src/test/test-utils'
import { ChainId } from 'wallet/src/constants/chains'
import { noOpFunction } from 'wallet/src/test/utils'

jest.mock('wallet/src/features/gas/hooks', () => {
  return {
    useUSDValue: (_chainId: ChainId, gasFee: string): string => gasFee,
  }
})

describe(NetworkFee, () => {
  it('renders a NetworkFee normally', () => {
    const tree = render(
      <NetworkFee
        chainId={ChainId.Mainnet}
        gasFee={{ value: '500', loading: false }}
        onShowNetworkFeeInfo={noOpFunction}
      />
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders a NetworkFee in a loading state', () => {
    const tree = render(
      <NetworkFee
        chainId={ChainId.Mainnet}
        gasFee={{ loading: true }}
        onShowNetworkFeeInfo={noOpFunction}
      />
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders a NetworkFee in an error state', () => {
    const tree = render(
      <NetworkFee
        chainId={ChainId.Mainnet}
        gasFee={{ error: true, loading: false }}
        onShowNetworkFeeInfo={noOpFunction}
      />
    )
    expect(tree).toMatchSnapshot()
  })
})
