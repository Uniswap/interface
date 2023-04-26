import React from 'react'
import { SelectionCircle } from 'src/components/input/SelectionCircle'
import { render } from 'src/test/test-utils'

it('renders selection circle', () => {
  const tree = render(<SelectionCircle selected size="icon20" />)
  expect(tree).toMatchSnapshot()
})
