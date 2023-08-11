import React from 'react'
import { render } from 'src/test/test-utils'
import { CurrencyLogo } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { arbitrumDaiCurrencyInfo, uniCurrencyInfo } from 'wallet/src/test/fixtures'

jest.mock('ui/src/assets/', () => 'ethereum-logo.png')

it('renders a currency logo without network logo', () => {
  const tree = render(<CurrencyLogo currencyInfo={uniCurrencyInfo} size={20} />)
  expect(tree).toMatchSnapshot()
})

it('renders a currency logo with network logo', () => {
  const tree = render(<CurrencyLogo currencyInfo={arbitrumDaiCurrencyInfo} size={20} />)
  expect(tree).toMatchSnapshot()
})
