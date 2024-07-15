import { WebKeyring } from 'wallet/src/features/wallet/Keyring/Keyring.web'
import { SAMPLE_PASSWORD, SAMPLE_SEED, SAMPLE_SEED_ADDRESS_1 } from 'wallet/src/test/fixtures'

const base64EncryptionKey = '9AUCx5ZQFC60vBL51aEwSCPIvAcalrZv3bRKVnRa3E8='
jest.mock('./crypto', () => ({
  ...jest.requireActual('./crypto'),
  exportKey: jest.fn().mockReturnValue('9AUCx5ZQFC60vBL51aEwSCPIvAcalrZv3bRKVnRa3E8='),
  encrypt: jest.fn().mockResolvedValue('encrypted'),
  decrypt: jest.fn().mockImplementation(async ({ encryptionKey, ciphertext }): Promise<string> => {
    const SAMPLE_SEED_MOCK = [
      'dove',
      'lumber',
      'quote',
      'board',
      'young',
      'robust',
      'kit',
      'invite',
      'plastic',
      'regular',
      'skull',
      'history',
    ].join(' ')
    if (ciphertext === 'fail') {
      return Promise.resolve('an invalid seed phrase that will fail at Wallet.fromMnemonic()')
    }
    const b64 = await jest.requireActual('./crypto').exportKey(encryptionKey)
    if (b64 === base64EncryptionKey) {
      return Promise.resolve(SAMPLE_SEED_MOCK)
    }

    return Promise.reject('Wrong password')
  }),
  generateNewSalt: jest
    .fn()
    .mockReturnValue(
      new Uint8Array([190, 197, 42, 2, 229, 18, 122, 161, 234, 166, 219, 110, 247, 102, 197, 214])
    ),
  generateNewIV: jest
    .fn()
    .mockReturnValue(new Uint8Array([142, 65, 15, 198, 69, 200, 74, 43, 159, 8, 170, 46])),
}))

const mockStore = async ({ data }: { data: Record<string, string> }): Promise<void> => {
  await chrome.storage.local.set(data)
}

const ENCRYPTION_KEY_KEY = 'com.uniswap.web.encryptionKey'

describe(WebKeyring, () => {
  beforeEach(async () => {
    await chrome.storage.local.clear()
  })

  describe('getMnemonicIds', () => {
    it('returns all mnemonic ids', async () => {
      await mockStore({
        data: {
          'com.uniswap.web.mnemonic.address1': 'my mnemonic',
          'com.uniswap.web.mnemonic.address2': 'my mnemonic',
          'com.uniswap.web.privateKey.address3': 'private-key',
        },
      })
      const keyring = new WebKeyring()

      const allMnemonics = await keyring.getMnemonicIds()

      expect(allMnemonics).toEqual(['address1', 'address2'])
    })
  })

  describe('importMnemonic', () => {
    it('correctly imports valid mnemonics', async () => {
      const keyring = new WebKeyring()

      const mnemonicId = await keyring.importMnemonic(SAMPLE_SEED, SAMPLE_PASSWORD)

      expect(mnemonicId).toEqual(SAMPLE_SEED_ADDRESS_1)
    })

    it('fails when mnemonic is not valid', async () => {
      const keyring = new WebKeyring()

      const action = async (): Promise<string> => {
        return keyring.importMnemonic('invalid seed', SAMPLE_PASSWORD)
      }

      await expect(action()).rejects.toThrow()
    })
  })

  describe('retrieveMnemonicUnlocked', () => {
    beforeEach(() => {
      jest.spyOn(chrome.storage.session, 'get').mockImplementation(() => {
        return new Promise((resolve) => {
          resolve({ [ENCRYPTION_KEY_KEY]: base64EncryptionKey })
        })
      })
    })

    it('returns mnemonic when unlocked', async () => {
      const keyring = new WebKeyring()
      await keyring.importMnemonic(SAMPLE_SEED, SAMPLE_PASSWORD)
      await keyring.unlock(SAMPLE_PASSWORD)

      const mnemonic = await keyring.retrieveMnemonicUnlocked(SAMPLE_SEED_ADDRESS_1)
      expect(mnemonic).toEqual(SAMPLE_SEED)
    })
  })

  describe('unlock', () => {
    it('succeeds when password is valid', async () => {
      const keyring = new WebKeyring()
      await keyring.importMnemonic(SAMPLE_SEED, SAMPLE_PASSWORD)

      const isUnlocked = await keyring.unlock(SAMPLE_PASSWORD)

      expect(isUnlocked).toBeTruthy()
    })

    it('fails when password is invalid', async () => {
      const keyring = new WebKeyring()
      await keyring.importMnemonic(SAMPLE_SEED, SAMPLE_PASSWORD)

      const action = (): Promise<boolean> => keyring.unlock('fail')

      await expect(action()).rejects.toThrow()
    })

    it('fails when password is valid, but stored mnemonic is not', async () => {
      const keyring = new WebKeyring()
      await mockStore({
        data: {
          [`com.uniswap.web.mnemonic.${SAMPLE_SEED_ADDRESS_1}`]: JSON.stringify({
            ciphertext: 'fail',
          }),
        },
      })

      const action = (): Promise<boolean> => keyring.unlock(SAMPLE_PASSWORD)

      await expect(action()).rejects.toThrow()
    })

    it('fails when there are no saved mnemonics', async () => {
      const keyring = new WebKeyring()

      const action = async (): Promise<boolean> => {
        return keyring.unlock(SAMPLE_PASSWORD)
      }

      await expect(action()).rejects.toThrow()
    })
  })
})
