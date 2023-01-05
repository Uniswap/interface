import React from 'react'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { arbitrumDaiCurrencyInfo, uniCurrencyInfo } from 'src/test/fixtures'
import { render } from 'src/test/test-utils'

jest.mock('src/assets', () => 'ethereum-logo.png')

it('renders a currency logo without network logo', () => {
  const tree = render(<CurrencyLogo currencyInfo={uniCurrencyInfo} size={20} />)
  expect(tree).toMatchSnapshot()
})

it('renders a currency logo with network logo', () => {
  const tree = render(<CurrencyLogo currencyInfo={arbitrumDaiCurrencyInfo} size={20} />)
  expect(tree).toMatchSnapshot()
})
