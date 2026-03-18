import '@testing-library/jest-native'

import { ReactNode } from 'react'
import { Text } from 'ui/src'
import { ActionSheetDropdown } from 'uniswap/src/components/dropdowns/ActionSheetDropdown'
import { MenuItemProp } from 'uniswap/src/components/modals/ActionSheetModal'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { fireEvent, render, screen, waitFor, waitForElementToBeRemoved } from 'uniswap/src/test/test-utils'

vi.mock('react-native', async (importOriginal) => {
  const actualReactNative = await importOriginal<typeof import('react-native')>()

  // In web environment (react-native-web), View doesn't have prototype.measureInWindow
  // So we need to handle this safely - only set if prototype exists
  const MockedView = actualReactNative.View

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (MockedView?.prototype) {
    MockedView.prototype.measureInWindow = (
      callback: (x: number, y: number, width: number, height: number) => void,
    ): void => {
      // Provide mock measurements
      const mockX = 0
      const mockY = 0
      const mockWidth = 100
      const mockHeight = 50
      callback(mockX, mockY, mockWidth, mockHeight)
    }
  }

  return actualReactNative
})

vi.mock('tamagui', async (importOriginal) => {
  const actualTamagui = await importOriginal<typeof import('tamagui')>()

  return {
    ...actualTamagui,
    Portal: ({ children }: { children: ReactNode }): ReactNode => children,
  }
})

const createOption = (key: string, label: string): MenuItemProp => ({
  key,
  onPress: vi.fn(),
  render: () => <Text>{label}</Text>,
})

const options: MenuItemProp[] = [
  createOption('option1', 'Option 1'),
  createOption('option2', 'Option 2'),
  createOption('option3', 'Option 3'),
]

const openDropdown = async (): Promise<void> => {
  const toggle = screen.getByTestId('dropdown-toggle')

  fireEvent.press(toggle, ON_PRESS_EVENT_PAYLOAD)

  // Wait until is open
  await waitFor(() => expect(screen.queryByTestId('dropdown-content')).toBeTruthy())
}

describe(ActionSheetDropdown, () => {
  it('should render', () => {
    const tree = render(<ActionSheetDropdown options={options} />)

    expect(tree).toMatchSnapshot()
  })

  // TODO: Skip tests that require dropdown to open - doesn't work in jsdom/Vitest environment
  // The dropdown state management and Portal rendering don't function properly in jsdom
  it.skip('opens the dropdown when the toggle is pressed', async () => {
    render(<ActionSheetDropdown options={options} />)

    // Should be closed by default
    expect(screen.queryByTestId('dropdown-content')).toBeNull()

    await openDropdown()

    // Should render all options
    options.forEach(({ key }) => expect(screen.queryByTestId(key)).toBeTruthy())
  })

  it.skip('closes the dropdown after pressing on a backdrop', async () => {
    const { getByTestId } = render(<ActionSheetDropdown options={options} />)
    await openDropdown()

    const backdrop = getByTestId('dropdown-backdrop')

    fireEvent.press(backdrop, ON_PRESS_EVENT_PAYLOAD)

    // Should be closed after pressing the backdrop
    await waitForElementToBeRemoved(() => screen.queryByTestId('dropdown-content'))
  })

  it.skip('closes the dropdown after pressing on an option', async () => {
    const { getByTestId } = render(<ActionSheetDropdown options={options} />)

    await openDropdown()

    const option = getByTestId('option1')

    fireEvent.press(option, ON_PRESS_EVENT_PAYLOAD)

    // Should be closed after pressing an option
    await waitForElementToBeRemoved(() => screen.queryByTestId('dropdown-content'))
  })

  it.skip('calls the onPress function of the option after pressing on an option', async () => {
    const { getByTestId } = render(<ActionSheetDropdown options={options} />)

    await openDropdown()

    const option = getByTestId('option3')

    fireEvent.press(option, ON_PRESS_EVENT_PAYLOAD)

    await waitFor(() => {
      // Should call the onPress function of the option
      expect(options[2]?.onPress).toHaveBeenCalledTimes(1)
    })
  })
})
