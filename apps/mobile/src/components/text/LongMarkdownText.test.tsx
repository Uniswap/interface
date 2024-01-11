import React from 'react'
import { LongMarkdownText } from 'src/components/text/LongMarkdownText'
import { render } from 'src/test/test-utils'

it('renders a LongMarkdownText', () => {
  const tree = render(<LongMarkdownText text="Some very long text" />)

  expect(tree).toMatchSnapshot()
})
