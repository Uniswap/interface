import React from 'react'
import { InlineNetworkPill, NetworkPill } from 'src/components/Network/NetworkPill'
import { render } from 'src/test/test-utils'
import { ChainId } from 'wallet/src/constants/chains'

describe(NetworkPill, () => {
  it('renders a NetworkPill without image', () => {
    const tree = render(<NetworkPill chainId={ChainId.Goerli} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders a NetworkPill with border', () => {
    const tree = render(<NetworkPill chainId={ChainId.Goerli} showBorder={true} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders an InlineNetworkPill', () => {
    const tree = render(<InlineNetworkPill chainId={ChainId.Goerli} />)
    expect(tree).toMatchSnapshot()
  })
})
