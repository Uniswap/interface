import React from 'react'
import { arbitrumDaiCurrencyInfo, uniCurrencyInfo } from 'src/test/fixtures'
import { render } from 'src/test/test-utils'
import { CurrencyLogo } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'

jest.mock('ui/src/assets/', () => 'ethereum-logo.png')

it('renders a currency logo without network logo', () => {
  const tree = render(<CurrencyLogo currencyInfo={uniCurrencyInfo} size={20} />)
  expect(tree).toMatchSnapshot()
})

it('renders a currency logo with network logo', () => {
  const tree = render(<CurrencyLogo currencyInfo={arbitrumDaiCurrencyInfo} size={20} />)
  expect(tree).toMatchSnapshot()
})
