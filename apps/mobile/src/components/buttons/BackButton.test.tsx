import React from 'react'
import { BackButton } from 'src/components/buttons/BackButton'
import { fireEvent, render, screen } from 'src/test/test-utils'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'

const mockedGoBack = vi.fn()
vi.mock('@react-navigation/native', async () => {
  const actualNav = await vi.importActual<typeof import('@react-navigation/native')>('@react-navigation/native')
  return {
    ...actualNav,
    useNavigation: (): unknown => ({
      ...actualNav.useNavigation,
      goBack: mockedGoBack,
    }),
  }
})

describe(BackButton, () => {
  it('renders without error', async () => {
    const tree = render(<BackButton showButtonLabel />)

    expect(tree).toMatchSnapshot()
    expect(await screen.findByText('common.button.back')).toBeDefined()
  })

  it('calls goBack', async () => {
    render(<BackButton showButtonLabel />)

    const button = await screen.findByText('common.button.back')
    fireEvent.press(button, ON_PRESS_EVENT_PAYLOAD)

    expect(mockedGoBack).toHaveBeenCalledTimes(1)
  })
})
