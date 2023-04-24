import React from 'react'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { render } from 'src/test/test-utils'

it('renders a relative change', () => {
  const tree = render(<RelativeChange change={12} />)
  expect(tree).toMatchSnapshot()
})

it('renders placeholders without a change', () => {
  const tree = render(<RelativeChange />)
  expect(tree).toMatchSnapshot()
})

it('renders placeholders with absolute change', () => {
  const tree = render(<RelativeChange absoluteChange={100} change={12} />)
  expect(tree).toMatchSnapshot()
})
