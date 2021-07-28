import React from 'react'
import RoutingDiagram, { Route } from './RoutingDiagram'
import { Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { render } from 'test-utils'
import useHttpLocations from 'hooks/useHttpLocations'

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

// mock useHttpLocations to avoid having to load Web3
jest.mock('hooks/useHttpLocations')
const mockUseHttpLocation = useHttpLocations as jest.MockedFunction<typeof useHttpLocations>

// avoid large snapshots
jest.mock('components/DoubleLogo', () => 'DoubleLogo')

beforeEach(() => {
  mockUseHttpLocation.mockReturnValue([])
})

it('renders when no routes are provided', () => {
  const { asFragment } = render(<RoutingDiagram currencyIn={DAI} currencyOut={USDC} routes={[]} />)
  expect(asFragment()).toMatchSnapshot()
})

it('renders single route', () => {
  const { asFragment } = render(<RoutingDiagram currencyIn={USDC} currencyOut={DAI} routes={[singleRoute]} />)
  expect(asFragment()).toMatchSnapshot()
})

it('renders multi route', () => {
  const { asFragment } = render(<RoutingDiagram currencyIn={USDC} currencyOut={DAI} routes={multiRoute} />)
  expect(asFragment()).toMatchSnapshot()
})
