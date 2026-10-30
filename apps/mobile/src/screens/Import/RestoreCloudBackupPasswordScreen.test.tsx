import { RouteProp } from '@react-navigation/core'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { TestID } from '@universe/test'
import React from 'react'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { restoreMnemonicFromCloudStorage } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { CloudBackupErrorCode } from 'src/features/CloudBackup/types'
import { onRestoreComplete } from 'src/screens/Import/onRestoreComplete'
import { RestoreCloudBackupPasswordScreen } from 'src/screens/Import/RestoreCloudBackupPasswordScreen'
import { act, fireEvent, render } from 'src/test/test-utils'
import { ImportType } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'

vi.mock('src/features/CloudBackup/RNCloudStorageBackupsManager', async (importOriginal) => ({
  ...(await importOriginal<typeof import('src/features/CloudBackup/RNCloudStorageBackupsManager')>()),
  restoreMnemonicFromCloudStorage: vi.fn(),
}))
vi.mock('src/screens/Import/onRestoreComplete', () => ({ onRestoreComplete: vi.fn() }))

const setOptionsSpy = vi.fn()
const routeProp = { params: {} } as RouteProp<OnboardingStackParamList, OnboardingScreens.RestoreCloudBackupPassword>
const restoreMnemonicRouteProp = { params: { importType: ImportType.RestoreMnemonic } } as RouteProp<
  OnboardingStackParamList,
  OnboardingScreens.RestoreCloudBackupPassword
>

describe(RestoreCloudBackupPasswordScreen, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows an unconfirmed upload without counting it as an incorrect password or completing restore', async () => {
    vi.mocked(restoreMnemonicFromCloudStorage).mockRejectedValueOnce({ code: CloudBackupErrorCode.UploadNotConfirmed })
    const screen = render(
      <RestoreCloudBackupPasswordScreen
        navigation={
          { getState: () => ({ index: 0 }), setOptions: setOptionsSpy } as unknown as NativeStackNavigationProp<
            OnboardingStackParamList,
            OnboardingScreens.RestoreCloudBackupPassword
          >
        }
        route={{ ...routeProp, params: { ...routeProp.params, mnemonicId: 'mnemonic' } }}
      />,
    )

    fireEvent.changeText(screen.getByPlaceholderText('account.cloud.password.input'), 'password')
    await act(async () => {
      fireEvent.press(screen.getByTestId(TestID.Continue))
    })

    expect(screen.getByText('settings.setting.backup.error.message.unconfirmed')).toBeDefined()
    expect(screen.store.getState().passwordLockout.passwordAttempts).toBe(0)
    expect(onRestoreComplete).not.toHaveBeenCalled()
    expect(restoreMnemonicFromCloudStorage).toHaveBeenCalledWith('mnemonic', 'password')
  })

  it('renders correctly', () => {
    const tree = render(
      <RestoreCloudBackupPasswordScreen
        navigation={
          {
            getState: () => ({
              index: 0,
            }),
            setOptions: setOptionsSpy,
          } as unknown as NativeStackNavigationProp<
            OnboardingStackParamList,
            OnboardingScreens.RestoreCloudBackupPassword,
            undefined
          >
        }
        route={routeProp}
      />,
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('renders the enter-recovery-phrase link when restoring a mnemonic', () => {
    const tree = render(
      <RestoreCloudBackupPasswordScreen
        navigation={
          {
            getState: () => ({
              index: 0,
            }),
            setOptions: setOptionsSpy,
          } as unknown as NativeStackNavigationProp<
            OnboardingStackParamList,
            OnboardingScreens.RestoreCloudBackupPassword,
            undefined
          >
        }
        route={restoreMnemonicRouteProp}
      />,
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
