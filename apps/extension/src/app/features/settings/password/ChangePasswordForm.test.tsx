import { act, fireEvent, waitFor } from '@testing-library/react'
import { ChangePasswordForm } from 'src/app/features/settings/password/ChangePasswordForm'
import { cleanup, render, screen } from 'src/test/test-utils'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

// Mock the Keyring
jest.mock('wallet/src/features/wallet/Keyring/Keyring', () => ({
  Keyring: {
    changePassword: jest.fn().mockResolvedValue(undefined),
  },
}))

// Mock analytics
jest.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: jest.fn(),
}))

const mockChangePassword = Keyring.changePassword as jest.MockedFunction<typeof Keyring.changePassword>

describe('ChangePasswordForm', () => {
  const mockOnNext = jest.fn()
  const oldPassword = 'MyOldPassword123!'

  beforeEach(() => {
    jest.clearAllMocks()
    mockChangePassword.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders without error', () => {
    const tree = render(<ChangePasswordForm oldPassword={oldPassword} onNext={mockOnNext} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders password input fields', () => {
    render(<ChangePasswordForm oldPassword={oldPassword} onNext={mockOnNext} />)

    // Check for translated placeholders
    expect(screen.getByPlaceholderText('New password')).toBeDefined()
    expect(screen.getByPlaceholderText('Confirm password')).toBeDefined()
  })

  it('renders continue button', () => {
    render(<ChangePasswordForm oldPassword={oldPassword} onNext={mockOnNext} />)

    expect(screen.getByText('Continue')).toBeDefined()
  })

  it('shows error when new password matches old password', async () => {
    render(<ChangePasswordForm oldPassword={oldPassword} onNext={mockOnNext} />)

    const newPasswordInput = screen.getByPlaceholderText('New password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm password')

    // Type the same password as the old password
    act(() => {
      fireEvent.change(newPasswordInput, { target: { value: oldPassword } })
      fireEvent.change(confirmPasswordInput, { target: { value: oldPassword } })
    })

    // Wait for error to appear
    await waitFor(() => {
      const errorText = screen.getByText('New password must be different from current password')
      expect(errorText).toBeDefined()
    })
  })

  it('clears error when password changes to be different', async () => {
    render(<ChangePasswordForm oldPassword={oldPassword} onNext={mockOnNext} />)

    const newPasswordInput = screen.getByPlaceholderText('New password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm password')

    // First, type the same password as old password
    act(() => {
      fireEvent.change(newPasswordInput, { target: { value: oldPassword } })
      fireEvent.change(confirmPasswordInput, { target: { value: oldPassword } })
    })

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('New password must be different from current password')).toBeDefined()
    })

    // Clear and type a different password
    act(() => {
      fireEvent.change(newPasswordInput, { target: { value: 'DifferentPassword789!' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword789!' } })
    })

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText('New password must be different from current password')).toBeNull()
    })
  })

  it('does not call onNext when passwords match old password', async () => {
    render(<ChangePasswordForm oldPassword={oldPassword} onNext={mockOnNext} />)

    const newPasswordInput = screen.getByPlaceholderText('New password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm password')
    const submitButton = screen.getByText('Continue')

    // Type the same password as the old password
    act(() => {
      fireEvent.change(newPasswordInput, { target: { value: oldPassword } })
      fireEvent.change(confirmPasswordInput, { target: { value: oldPassword } })
    })

    // Try to submit
    await act(async () => {
      fireEvent.click(submitButton)
    })

    expect(mockOnNext).not.toHaveBeenCalled()
    expect(mockChangePassword).not.toHaveBeenCalled()
  })

  it('calls onNext and changePassword when passwords are different and valid', async () => {
    render(<ChangePasswordForm oldPassword={oldPassword} onNext={mockOnNext} />)

    const newPasswordInput = screen.getByPlaceholderText('New password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm password')
    const submitButton = screen.getByText('Continue')

    const newPassword = 'MyNewStrongPassword456!'

    // Type a different password
    act(() => {
      fireEvent.change(newPasswordInput, { target: { value: newPassword } })
      fireEvent.change(confirmPasswordInput, { target: { value: newPassword } })
    })

    // Submit the form
    await act(async () => {
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith(newPassword)
      expect(mockOnNext).toHaveBeenCalledWith(newPassword)
    })
  })

  it('handles undefined oldPassword gracefully', async () => {
    render(<ChangePasswordForm oldPassword={undefined} onNext={mockOnNext} />)

    const newPasswordInput = screen.getByPlaceholderText('New password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm password')

    const newPassword = 'AnyPassword123!'

    // Type any password - should not show "same password" error since oldPassword is undefined
    act(() => {
      fireEvent.change(newPasswordInput, { target: { value: newPassword } })
      fireEvent.change(confirmPasswordInput, { target: { value: newPassword } })
    })

    await waitFor(() => {
      expect(screen.queryByText('New password must be different from current password')).toBeNull()
    })
  })
})
