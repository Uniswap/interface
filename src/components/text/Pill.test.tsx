import React from 'react'
import { Text } from 'src/components/Text'
import { Pill } from 'src/components/text/Pill'
import { renderWithTheme } from 'src/test/render'

it('renders a Pill without image', () => {
  const tree = renderWithTheme(
    <Pill label="My Pill Label" foregroundColor="blue" backgroundColor="orange" />
  )
  expect(tree).toMatchSnapshot()
})

it('renders a Pill with border', () => {
  const tree = renderWithTheme(
    <Pill label="My Second Pill Label" icon={<Text>Icon</Text>} borderColor="green" />
  )
  expect(tree).toMatchSnapshot()
})
