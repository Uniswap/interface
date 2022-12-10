import React from 'react'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { arbitrumDaiCurrencyInfo, uniCurrencyInfo } from 'src/test/fixtures'
import { renderWithTheme } from 'src/test/render'

jest.mock('src/assets', () => 'ethereum-logo.png')

it('renders a currency logo without network logo', () => {
  const tree = renderWithTheme(<CurrencyLogo currencyInfo={uniCurrencyInfo} size={20} />)
  expect(tree).toMatchSnapshot()
})

it('renders a currency logo with network logo', () => {
  const tree = renderWithTheme(<CurrencyLogo currencyInfo={arbitrumDaiCurrencyInfo} size={20} />)
  expect(tree).toMatchSnapshot()
})
