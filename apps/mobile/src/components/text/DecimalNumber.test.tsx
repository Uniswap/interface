import React from 'react'
import { DecimalNumber } from 'src/components/text/DecimalNumber'
import { render } from 'src/test/test-utils'

it('renders a DecimalNumber', () => {
  const tree = render(
    <DecimalNumber formattedNumber="14,123.78" number={14123.78} variant="body1" />
  )

  expect(tree).toMatchSnapshot()
})

it('renders a DecimalNumber without a comma separator', () => {
  const tree = render(
    <DecimalNumber formattedNumber="14,23" number={14.23} separator="," variant="body1" />
  )

  expect(tree).toMatchSnapshot()
})

it('renders a DecimalNumber without a decimal part', () => {
  const tree = render(<DecimalNumber formattedNumber="14,123" number={14.123} variant="body1" />)

  expect(tree).toMatchSnapshot()
})
