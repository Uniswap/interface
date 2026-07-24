import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { DigitInputState } from 'uniswap/src/components/passkey/recovery/useDigitInput'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { PasscodeStep } from '~/components/Passkey/AddBackupLoginSteps'
import { AddPasskeyStep, RotationExpiredStep, RotationIntroStep } from '~/components/Passkey/RecoverWalletSteps'
import { render, screen } from '~/test-utils/render'

// The full AddressDisplay pulls in UniswapContext + account icon plumbing; the rotation
// add-passkey step only needs to prove it renders the recovered wallet, so stub it to the address.
vi.mock('uniswap/src/components/accounts/AddressDisplay', () => ({
  AddressDisplay: ({ address }: { address: string }) => <div>{address}</div>,
}))

// The rotation step components receive `t` as a prop; this harness supplies the real one so
// assertions run against the English source strings (i.e. the Figma copy).
function WithT({ children }: { children: (t: TFunction) => ReactNode }): JSX.Element {
  const { t } = useTranslation()
  return <>{children(t)}</>
}

const digitInput: DigitInputState = {
  digits: ['', '', '', ''],
  refs: { current: [] },
  handleChange: vi.fn(),
  handleKeyDown: vi.fn(),
  handlePaste: vi.fn(),
  reset: vi.fn(),
}

describe('recover-with-email rotation steps match the rotation mocks', () => {
  it('intro step matches "Update your passcode" (12482-89035): body, learn more, method + overflow, new-passcode badge, CTA', () => {
    render(
      <WithT>
        {(t) => (
          <RotationIntroStep
            provider="google"
            email="zack.labadie@uniswap.org"
            onContinue={vi.fn()}
            onRemove={vi.fn()}
            handleClose={vi.fn()}
            t={t}
          />
        )}
      </WithT>,
    )
    expect(screen.getByText('Update your passcode')).toBeInTheDocument()
    expect(
      screen.getByText(
        'We’ve improved security for backup logins. Update your passcode to switch to the stronger setup. Your funds will remain secure.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Learn more')).toBeInTheDocument()
    expect(screen.getByText('zack.labadie@uniswap.org')).toBeInTheDocument()
    expect(screen.getByTestId(TestID.RemoveBackupLoginOverflow)).toBeInTheDocument()
    expect(screen.getByText('New passcode required')).toBeInTheDocument()
    expect(screen.getByText('Update passcode')).toBeInTheDocument()
  })

  it('expired step matches "Backup login expired" (12482-24302)', () => {
    render(<WithT>{(t) => <RotationExpiredStep onContinueWithPasskey={vi.fn()} handleClose={vi.fn()} t={t} />}</WithT>)
    expect(screen.getByText('Backup login expired')).toBeInTheDocument()
    expect(
      screen.getByText('You can still access your wallet using a passkey or recovery phrase. Your funds are safe.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Continue with passkey')).toBeInTheDocument()
  })

  it('add-passkey rotation variant matches "Add a passkey for this device" (12482-89550)', () => {
    const walletAddress = '0x1234567890123456789012345678901234567890'
    render(
      <WithT>
        {(t) => (
          <AddPasskeyStep
            addPasskeyError={undefined}
            handleAddPasskey={vi.fn()}
            handleClose={vi.fn()}
            isRotation
            walletAddress={walletAddress}
            t={t}
          />
        )}
      </WithT>,
    )
    expect(screen.getByText('Add a passkey for this device')).toBeInTheDocument()
    expect(
      screen.getByText('This final step keeps your account secure and will help you quickly sign in next time.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Add passkey')).toBeInTheDocument()
    // Rotation variant shows the recovered wallet via AddressDisplay instead of a static icon.
    expect(screen.getByText(walletAddress)).toBeInTheDocument()
  })

  it('set-passcode step: "Set your new passcode"', () => {
    render(
      <WithT>
        {(t) => (
          <PasscodeStep
            title={t('account.passkey.reconnect.setPasscode.title')}
            description={t('account.passkey.backupLogin.setPasscode.description')}
            digitInput={digitInput}
            showPasscode={false}
            setShowPasscode={vi.fn()}
            passcodeError={undefined}
            isEncrypting={false}
            handleBack={vi.fn()}
            handleClose={vi.fn()}
            t={t}
          />
        )}
      </WithT>,
    )
    expect(screen.getByText('Set your new passcode')).toBeInTheDocument()
    expect(screen.getByText('You’ll need this when using your backup login.')).toBeInTheDocument()
  })

  it('confirm-passcode step: "Re-enter your new passcode"', () => {
    render(
      <WithT>
        {(t) => (
          <PasscodeStep
            title={t('account.passkey.reconnect.confirmPasscode.title')}
            description={t('account.passkey.reconnect.confirmPasscode.description')}
            digitInput={digitInput}
            showPasscode={false}
            setShowPasscode={vi.fn()}
            passcodeError={undefined}
            isEncrypting={false}
            handleBack={vi.fn()}
            handleClose={vi.fn()}
            t={t}
          />
        )}
      </WithT>,
    )
    expect(screen.getByText('Re-enter your new passcode')).toBeInTheDocument()
    expect(screen.getByText('Confirm your updated 4-digit passcode.')).toBeInTheDocument()
  })
})
