import React from 'react'
import { DecimalNumber } from 'src/components/text/DecimalNumber'
import { renderWithTheme } from 'src/test/render'

it('renders a DecimalNumber', () => {
  const tree = renderWithTheme(<DecimalNumber number="14,123.78" variant="bodyLarge" />)

  expect(tree).toMatchSnapshot()
})

it('renders a DecimalNumber without a comma separator', () => {
  const tree = renderWithTheme(<DecimalNumber number="14,23" separator="," variant="bodyLarge" />)

  expect(tree).toMatchSnapshot()
})

it('renders a DecimalNumber without a decimal part', () => {
  const tree = renderWithTheme(<DecimalNumber number="14,123" variant="bodyLarge" />)

  expect(tree).toMatchSnapshot()
})
