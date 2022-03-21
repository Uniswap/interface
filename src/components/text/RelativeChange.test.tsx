import React from 'react'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { renderWithTheme } from 'src/test/render'

it('renders a relative change', () => {
  const tree = renderWithTheme(<RelativeChange change={12} />)
  expect(tree).toMatchSnapshot()
})

it('renders placeholders without a change', () => {
  const tree = renderWithTheme(<RelativeChange />)
  expect(tree).toMatchSnapshot()
})
