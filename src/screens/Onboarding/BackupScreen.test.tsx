import React from 'react'
import { BackupScreen } from 'src/screens/Onboarding/BackupScreen'
import { render, screen } from 'src/test/test-utils'

jest.mock('@react-navigation/elements', () => ({
  useHeaderHeight: jest.fn().mockImplementation(() => 200),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn().mockImplementation(() => ({})),
}))

describe(BackupScreen, () => {
  it('renders backup options when none are completed', async () => {
    const tree = render(<BackupScreen navigation={{} as any} route={{} as any} />)

    // expect(screen.findByText('Completed')).not.toBeDefined()
    expect(await screen.getAllByText('+ ADD').length).toBe(2)
    expect(tree.toJSON()).toMatchSnapshot()
  })

  // TODO [MOB-3941]: add more tests for the BackupScreen including mocking the store
})
