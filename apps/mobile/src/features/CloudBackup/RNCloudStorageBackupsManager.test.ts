import { backupMnemonicToCloudStorage } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'

const nativeBackup = vi.hoisted(() => vi.fn<(mnemonicId: string, password: string) => Promise<boolean>>())

vi.mock('react-native', () => ({
  NativeModules: { RNCloudStorageBackupsManager: { backupMnemonicToCloudStorage: nativeBackup } },
}))

function createDeferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
} {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, resolve, reject }
}

describe(backupMnemonicToCloudStorage, () => {
  beforeEach(() => {
    nativeBackup.mockReset()
  })

  it('shares an identical pending request across callers', async () => {
    const upload = createDeferred<boolean>()
    nativeBackup.mockReturnValueOnce(upload.promise)

    const first = backupMnemonicToCloudStorage('mnemonic', 'password-A')
    const second = backupMnemonicToCloudStorage('mnemonic', 'password-A')
    await Promise.resolve()
    expect(nativeBackup).toHaveBeenCalledTimes(1)

    upload.resolve(true)
    await expect(first).resolves.toBe(true)
    await expect(second).resolves.toBe(true)
  })

  it('reports the owning request failure to every identical caller and allows a retry', async () => {
    const upload = createDeferred<boolean>()
    const error = { code: 'backupUploadNotConfirmedError' }
    nativeBackup.mockReturnValueOnce(upload.promise).mockResolvedValueOnce(true)

    const first = backupMnemonicToCloudStorage('mnemonic', 'password-A')
    const second = backupMnemonicToCloudStorage('mnemonic', 'password-A')
    const firstFailure = first.catch((reason: unknown) => reason)
    const secondFailure = second.catch((reason: unknown) => reason)
    upload.reject(error)
    await expect(firstFailure).resolves.toBe(error)
    await expect(secondFailure).resolves.toBe(error)

    await expect(backupMnemonicToCloudStorage('mnemonic', 'password-A')).resolves.toBe(true)
    expect(nativeBackup).toHaveBeenCalledTimes(2)
  })

  it('uploads a different password only after the previous request settles', async () => {
    const firstUpload = createDeferred<boolean>()
    const secondUpload = createDeferred<boolean>()
    nativeBackup.mockReturnValueOnce(firstUpload.promise).mockReturnValueOnce(secondUpload.promise)

    const first = backupMnemonicToCloudStorage('mnemonic', 'password-A')
    const second = backupMnemonicToCloudStorage('mnemonic', 'password-B')
    const secondFinished = vi.fn()
    void second.then(secondFinished)
    await Promise.resolve()
    expect(nativeBackup).toHaveBeenCalledTimes(1)

    firstUpload.resolve(true)
    await expect(first).resolves.toBe(true)
    expect(nativeBackup).toHaveBeenNthCalledWith(2, 'mnemonic', 'password-B')
    expect(secondFinished).not.toHaveBeenCalled()

    secondUpload.resolve(true)
    await expect(second).resolves.toBe(true)
  })

  it('runs a different-password retry even when the previous upload fails', async () => {
    const upload = createDeferred<boolean>()
    const error = { code: 'iCloudQuotaExceededError' }
    nativeBackup.mockReturnValueOnce(upload.promise).mockResolvedValueOnce(true)

    const first = backupMnemonicToCloudStorage('mnemonic', 'password-A')
    const failure = first.catch((reason: unknown) => reason)
    const second = backupMnemonicToCloudStorage('mnemonic', 'password-B')
    upload.reject(error)
    await expect(failure).resolves.toBe(error)

    await expect(second).resolves.toBe(true)
    expect(nativeBackup).toHaveBeenNthCalledWith(2, 'mnemonic', 'password-B')
  })

  it('preserves request order when the password changes back while another request is queued', async () => {
    const firstUpload = createDeferred<boolean>()
    const secondUpload = createDeferred<boolean>()
    nativeBackup
      .mockReturnValueOnce(firstUpload.promise)
      .mockReturnValueOnce(secondUpload.promise)
      .mockResolvedValueOnce(true)

    const first = backupMnemonicToCloudStorage('mnemonic', 'password-A')
    const second = backupMnemonicToCloudStorage('mnemonic', 'password-B')
    const third = backupMnemonicToCloudStorage('mnemonic', 'password-A')
    const duplicateThird = backupMnemonicToCloudStorage('mnemonic', 'password-A')

    firstUpload.resolve(true)
    await expect(first).resolves.toBe(true)
    expect(nativeBackup).toHaveBeenCalledTimes(2)

    secondUpload.resolve(true)
    await expect(second).resolves.toBe(true)
    await expect(third).resolves.toBe(true)
    await expect(duplicateThird).resolves.toBe(true)
    expect(nativeBackup.mock.calls).toEqual([
      ['mnemonic', 'password-A'],
      ['mnemonic', 'password-B'],
      ['mnemonic', 'password-A'],
    ])
  })

  it('allows different mnemonics to upload independently', async () => {
    const upload = createDeferred<boolean>()
    nativeBackup.mockReturnValueOnce(upload.promise).mockResolvedValueOnce(true)

    const first = backupMnemonicToCloudStorage('mnemonic-A', 'password')
    await expect(backupMnemonicToCloudStorage('mnemonic-B', 'password')).resolves.toBe(true)
    expect(nativeBackup).toHaveBeenCalledTimes(2)

    upload.resolve(true)
    await expect(first).resolves.toBe(true)
  })
})
