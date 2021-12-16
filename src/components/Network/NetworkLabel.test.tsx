import React from 'react'
import { NetworkLabel } from 'src/components/Network/NetworkLabel'
import { ChainId } from 'src/constants/chains'
import { renderWithTheme } from 'src/test/render'

it('renders a NetworkLabel without image', () => {
  const tree = renderWithTheme(<NetworkLabel chainId={ChainId.RINKEBY} />)
  expect(tree).toMatchSnapshot()
})

it('renders a NetworkLabel with border', () => {
  const tree = renderWithTheme(<NetworkLabel chainId={ChainId.RINKEBY} showBorder={true} />)
  expect(tree).toMatchSnapshot()
})
