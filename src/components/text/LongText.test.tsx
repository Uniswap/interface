import React from 'react'
import { LongText } from 'src/components/text/LongText'
import { renderWithTheme } from 'src/test/render'

it('renders a LongText', () => {
  const tree = renderWithTheme(<LongText text="Some very long text" />)

  expect(tree).toMatchSnapshot()
})
