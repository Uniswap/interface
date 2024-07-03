import React from 'react'
import { TextWithFuseMatches } from 'src/components/text/TextWithFuseMatches'
import { render } from 'src/test/test-utils'

it('renders text without matches', () => {
  const tree = render(<TextWithFuseMatches text="A text without matches" />)
  expect(tree).toMatchSnapshot()
})

it('renders text with few matches', () => {
  const tree = render(
    <TextWithFuseMatches
      matches={[
        { value: 'A', indices: [[0, 1]] },
        { value: 'xt wit', indices: [[4, 8]] },
      ]}
      text="A text without matches"
    />,
  )
  expect(tree).toMatchSnapshot()
})
