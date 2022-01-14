import React from 'react'
import { Text } from 'src/components/Text'
import { Pill } from 'src/components/text/Pill'
import { renderWithTheme } from 'src/test/render'

it('renders a Pill without image', () => {
  const tree = renderWithTheme(
    <Pill backgroundColor="orange" foregroundColor="blue" label="My Pill Label" />
  )
  expect(tree).toMatchSnapshot()
})

it('renders a Pill with border', () => {
  const tree = renderWithTheme(
    <Pill borderColor="green" icon={<Text>Icon</Text>} label="My Second Pill Label" />
  )
  expect(tree).toMatchSnapshot()
})
