import React from 'react'
import RoutingDiagram, { Route } from './RoutingDiagram'
import { Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { render } from '../../utils/testUtils'

const USDC = new Token(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC')
const DAI = new Token(1, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 6, 'DAI')
const MKR = new Token(1, '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', 6, 'MKR')

const singleRoute: Route = { percent: 100, path: [[USDC, DAI, FeeAmount.LOW]] }

const multiRoute: Route[] = [
  { percent: 75, path: [[USDC, DAI, FeeAmount.LOW]] },
  {
    percent: 25,
    path: [
      [USDC, MKR, FeeAmount.MEDIUM],
      [MKR, DAI, FeeAmount.HIGH],
    ],
  },
]

it('renders when no routes are provided', () => {
  const component = render(<RoutingDiagram currencyIn={DAI} currencyOut={USDC} routes={[]} />)
  expect(component).toMatchSnapshot()
})

it('renders single route', () => {
  const component = render(<RoutingDiagram currencyIn={USDC} currencyOut={DAI} routes={[singleRoute]} />)
  expect(component).toMatchSnapshot()
})

it('renders multi route', () => {
  const component = render(<RoutingDiagram currencyIn={USDC} currencyOut={DAI} routes={multiRoute} />)
  expect(component).toMatchSnapshot()
})
