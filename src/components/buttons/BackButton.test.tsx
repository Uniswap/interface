import React from 'react'
import { BackButton } from 'src/components/buttons/BackButton'
import { fireEvent, render, screen } from 'src/test/test-utils'

const mockedGoBack = jest.fn()
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native')
  return {
    ...actualNav,
    useNavigation: () => ({
      ...actualNav.useNavigation,
      goBack: mockedGoBack,
    }),
  }
})

describe(BackButton, () => {
  it('renders without error', async () => {
    render(<BackButton showButtonLabel />)

    expect(await screen.findByText('Back')).toBeDefined()
  })

  it('calls goBack', async () => {
    render(<BackButton showButtonLabel />)

    const button = await screen.findByText('Back')
    fireEvent.press(button)

    expect(mockedGoBack).toHaveBeenCalledTimes(1)
  })
})
