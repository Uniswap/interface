import React from 'react'
import { Text } from 'src/components/Text'
import { Pill } from 'src/components/text/Pill'
import { render } from 'src/test/test-utils'

it('renders a Pill without image', () => {
  const tree = render(
    <Pill backgroundColor="surface2" foregroundColor="accent1" label="My Pill Label" />
  )
  expect(tree).toMatchSnapshot()
})

it('renders a Pill with border', () => {
  const tree = render(
    <Pill borderColor="statusSuccess" icon={<Text>Icon</Text>} label="My Second Pill Label" />
  )
  expect(tree).toMatchSnapshot()
})
