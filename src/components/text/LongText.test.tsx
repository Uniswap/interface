import React from 'react'
import { LongText } from 'src/components/text/LongText'
import { render } from 'src/test/test-utils'

it('renders a LongText', () => {
  const tree = render(<LongText text="Some very long text" />)

  expect(tree).toMatchSnapshot()
})
