import { render } from '@testing-library/react-native'
import React from 'react'
import { CurrencyAndNetworkLogo } from 'src/components/CurrencyLogo'
import { ChainId } from 'src/constants/chains'
import { UNI } from 'src/constants/tokens'

jest.mock('src/assets', () => 'ethereum-logo.png')

it('renders a currency logo without network logo', () => {
  const tree = render(<CurrencyAndNetworkLogo currency={UNI[ChainId.MAINNET]} size={20} />).toJSON()
  expect(tree).toMatchSnapshot()
})

it('renders a currency logo with network logo', () => {
  const tree = render(<CurrencyAndNetworkLogo currency={UNI[ChainId.RINKEBY]} size={20} />).toJSON()
  expect(tree).toMatchSnapshot()
})
