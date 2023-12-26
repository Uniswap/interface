import React from 'react'
import { BackButton } from 'src/components/buttons/BackButton'
import { ON_PRESS_EVENT_PAYLOAD } from 'src/test/eventFixtures'
import { fireEvent, render, screen } from 'src/test/test-utils'

const mockedGoBack = jest.fn()
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native')
  return {
    ...actualNav,
    useNavigation: (): void => ({
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
    fireEvent.press(button, ON_PRESS_EVENT_PAYLOAD)

    expect(mockedGoBack).toHaveBeenCalledTimes(1)
  })
})
