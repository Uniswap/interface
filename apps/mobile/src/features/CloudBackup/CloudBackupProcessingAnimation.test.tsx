import { act, render } from '@testing-library/react'
import React, { ComponentProps, EffectCallback, PropsWithChildren, useEffect } from 'react'
import { Alert } from 'react-native'
import { CloudBackupProcessingAnimation } from 'src/features/CloudBackup/CloudBackupProcessingAnimation'
import { backupMnemonicToCloudStorage } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { CloudBackupErrorCode } from 'src/features/CloudBackup/types'
import { useSignerAccount } from 'wallet/src/features/wallet/hooks'
import { ACCOUNT } from 'wallet/src/test/fixtures/wallet/accounts'

vi.mock('@react-navigation/core', () => ({
  useFocusEffect: (effect: EffectCallback): void => useEffect(effect, [effect]),
}))

vi.mock('@universe/mycelium', () => ({
  Flex: ({ children }: PropsWithChildren): React.ReactNode => children,
  Text: ({ children }: PropsWithChildren): React.ReactNode => children,
  iconSizes: { icon40: 40 },
}))

vi.mock('ui/src/components/icons', () => ({ CheckmarkCircle: (): null => null }))
vi.mock('react-redux', () => ({ useDispatch: (): ReturnType<typeof vi.fn> => vi.fn() }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string): string => key }) }))
vi.mock('utilities/src/logger/logger', () => ({ logger: { error: vi.fn() } }))
vi.mock('wallet/src/features/wallet/hooks', () => ({ useSignerAccount: vi.fn() }))
vi.mock('wallet/src/features/onboarding/OnboardingContext', () => ({
  useOnboardingContext: () => ({
    getOnboardingOrImportedAccount: (): undefined => undefined,
    addBackupMethod: vi.fn(),
  }),
}))

vi.mock('src/features/CloudBackup/RNCloudStorageBackupsManager', async (importOriginal) => ({
  ...(await importOriginal<typeof import('src/features/CloudBackup/RNCloudStorageBackupsManager')>()),
  backupMnemonicToCloudStorage: vi.fn(),
}))

type Props = ComponentProps<typeof CloudBackupProcessingAnimation>

function createProps(): Props {
  return {
    accountAddress: ACCOUNT.address,
    password: 'password-B',
    onBackupComplete: vi.fn(),
    onErrorPress: vi.fn(),
    navigation: {
      addListener: vi.fn().mockReturnValue(vi.fn()),
      isFocused: vi.fn().mockReturnValue(true),
    } as unknown as Props['navigation'],
  }
}

function startBackup(props: Props): Promise<void> {
  const [, listener] = vi.mocked(props.navigation.addListener).mock.calls.find(([event]) => event === 'transitionEnd')!
  return (listener as () => Promise<void>)()
}

describe(CloudBackupProcessingAnimation, () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.mocked(useSignerAccount).mockReturnValue(ACCOUNT)
    vi.spyOn(Alert, 'alert').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('waits for its own upload even when another attempt has already set the cloud backup flag', async () => {
    let resolve!: (value: boolean) => void
    const upload = new Promise<boolean>((promiseResolve) => {
      resolve = promiseResolve
    })
    vi.mocked(backupMnemonicToCloudStorage).mockReturnValueOnce(upload)
    const props = createProps()
    const screen = render(<CloudBackupProcessingAnimation {...props} />)
    let backup!: Promise<void>
    act(() => {
      backup = startBackup(props)
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    expect(screen.getByText('settings.setting.backup.status.inProgress')).toBeDefined()
    expect(props.onBackupComplete).not.toHaveBeenCalled()

    await act(async () => {
      resolve(true)
      await backup
    })
    expect(screen.getByText('settings.setting.backup.status.complete')).toBeDefined()
    expect(props.onBackupComplete).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(props.onBackupComplete).toHaveBeenCalledTimes(1)
  })

  it('shows a failed shared request on the current screen after the original screen unmounts', async () => {
    let reject!: (reason: unknown) => void
    const upload = new Promise<boolean>((_, promiseReject) => {
      reject = promiseReject
    })
    vi.mocked(backupMnemonicToCloudStorage).mockReturnValue(upload)
    const firstProps = createProps()
    const firstScreen = render(<CloudBackupProcessingAnimation {...firstProps} />)
    let firstBackup!: Promise<void>
    act(() => {
      firstBackup = startBackup(firstProps)
    })
    vi.mocked(firstProps.navigation.isFocused).mockReturnValue(false)
    firstScreen.unmount()

    const currentProps = createProps()
    const currentScreen = render(<CloudBackupProcessingAnimation {...currentProps} />)
    let currentBackup!: Promise<void>
    act(() => {
      currentBackup = startBackup(currentProps)
    })

    await act(async () => {
      reject({ code: CloudBackupErrorCode.UploadNotConfirmed })
      await Promise.all([firstBackup, currentBackup])
    })
    expect(Alert.alert).toHaveBeenCalledTimes(1)
    expect(Alert.alert).toHaveBeenCalledWith(
      'settings.setting.backup.error.title',
      'settings.setting.backup.error.message.unconfirmed',
      [expect.objectContaining({ onPress: currentProps.onErrorPress })],
    )
    expect(currentScreen.queryByText('settings.setting.backup.status.complete')).toBeNull()
    expect(currentProps.onBackupComplete).not.toHaveBeenCalled()
  })
})
