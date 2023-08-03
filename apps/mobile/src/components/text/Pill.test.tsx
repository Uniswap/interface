import React from 'react'
import { Text } from 'src/components/Text'
import { Pill } from 'src/components/text/Pill'
import { render } from 'src/test/test-utils'

it('renders a Pill without image', () => {
  const tree = render(
    <Pill
      backgroundColor="DEP_background1"
      foregroundColor="DEP_accentActive"
      label="My Pill Label"
    />
  )
  expect(tree).toMatchSnapshot()
})

it('renders a Pill with border', () => {
  const tree = render(
    <Pill borderColor="DEP_accentSuccess" icon={<Text>Icon</Text>} label="My Second Pill Label" />
  )
  expect(tree).toMatchSnapshot()
})
