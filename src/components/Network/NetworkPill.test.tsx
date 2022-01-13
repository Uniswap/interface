import React from 'react'
import { NetworkPill } from 'src/components/Network/NetworkPill'
import { ChainId } from 'src/constants/chains'
import { renderWithTheme } from 'src/test/render'

it('renders a NetworkPill without image', () => {
  const tree = renderWithTheme(<NetworkPill chainId={ChainId.RINKEBY} />)
  expect(tree).toMatchSnapshot()
})

it('renders a NetworkPill with border', () => {
  const tree = renderWithTheme(<NetworkPill chainId={ChainId.RINKEBY} showBorder={true} />)
  expect(tree).toMatchSnapshot()
})
