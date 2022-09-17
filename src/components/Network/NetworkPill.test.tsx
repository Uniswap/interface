import React from 'react'
import { InlineNetworkPill, NetworkPill } from 'src/components/Network/NetworkPill'
import { ChainId } from 'src/constants/chains'
import { renderWithTheme } from 'src/test/render'

it('renders a NetworkPill without image', () => {
  const tree = renderWithTheme(<NetworkPill chainId={ChainId.Goerli} />)
  expect(tree).toMatchSnapshot()
})

it('renders a NetworkPill with border', () => {
  const tree = renderWithTheme(<NetworkPill chainId={ChainId.Goerli} showBorder={true} />)
  expect(tree).toMatchSnapshot()
})

it('renders an InlineNetworkPill', () => {
  const tree = renderWithTheme(<InlineNetworkPill chainId={ChainId.Goerli} />)
  expect(tree).toMatchSnapshot()
})
