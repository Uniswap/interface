import {
  SAMPLE_PASSWORD,
  SAMPLE_SEED,
  SAMPLE_SEED_ADDRESS_1,
  SAMPLE_SEED_ADDRESS_10,
  SAMPLE_SEED_ADDRESS_2,
  SAMPLE_SEED_ADDRESS_3,
  SAMPLE_SEED_ADDRESS_4,
  SAMPLE_SEED_ADDRESS_5,
  SAMPLE_SEED_ADDRESS_6,
  SAMPLE_SEED_ADDRESS_7,
  SAMPLE_SEED_ADDRESS_8,
  SAMPLE_SEED_ADDRESS_9,
} from 'uniswap/src/test/fixtures'
import { WebKeyring } from 'wallet/src/features/wallet/Keyring/Keyring.web'

type ChromeSessionStore = { [prop: string]: unknown }

const mockSessionStorage = (): unknown => {
  let store: ChromeSessionStore = {}

  return {
    get: async (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      key: string | string[] | { [key: string]: any } | null,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      callback: (items: { [key: string]: any }) => void,
    ): Promise<Record<string, unknown>> => {
      if (key === null) {
        return Promise.resolve(store)
      }

      if (typeof key === 'string') {
        return Promise.resolve({ [key]: store[key] })
      }

      if (Array.isArray(key)) {
        return Promise.resolve(
          key.reduce((acc, k) => {
            acc[k] = store[k]
            return acc
          }, {}),
        )
      }

      if (typeof key === 'object') {
        return Promise.resolve(
          Object.keys(key).reduce((acc, k) => {
            const value = store[k] ?? key[k]
            acc[k] = value
            return acc
          }, {} as ChromeSessionStore),
        )
      }

      return Promise.resolve({})
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    set: async (obj: { [prop: string]: unknown }, callback: (items: { [key: string]: any }) => void): Promise<void> => {
      for (const [key, value] of Object.entries(obj)) {
        store[key] = value
      }
      return Promise.resolve()
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    remove: async (key: string | string[], callback: (items: { [key: string]: any }) => void): Promise<void> => {
      if (Array.isArray(key)) {
        key.forEach((k) => {
          delete store[k]
        })
      } else {
        delete store[key]
      }
      return Promise.resolve()
    },
    clear: async (): Promise<void> => {
      store = {}
      return Promise.resolve()
    },
  }
}

Object.defineProperty(chrome.storage, 'session', {
  value: mockSessionStorage(),
})

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
    .mockReturnValue(new Uint8Array([190, 197, 42, 2, 229, 18, 122, 161, 234, 166, 219, 110, 247, 102, 197, 214])),
  generateNewIV: jest.fn().mockReturnValue(new Uint8Array([142, 65, 15, 198, 69, 200, 74, 43, 159, 8, 170, 46])),
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
          'com.uniswap.web.mnemonic.address1': SAMPLE_SEED,
          'com.uniswap.web.mnemonic.address2': SAMPLE_SEED,
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

  describe('unlock', () => {
    const keyring = new WebKeyring()

    it('succeeds when password is valid', async () => {
      await keyring.importMnemonic(SAMPLE_SEED, SAMPLE_PASSWORD)
      const isUnlocked = await keyring.unlock(SAMPLE_PASSWORD)

      expect(isUnlocked).toBeTruthy()
    })

    it('fails when password is invalid', async () => {
      await keyring.importMnemonic(SAMPLE_SEED, SAMPLE_PASSWORD)
      const isUnlocked = await keyring.unlock('fail')

      expect(isUnlocked).toBe(false)
    })

    it('fails when password is valid, but stored mnemonic is not', async () => {
      await mockStore({
        data: {
          [`com.uniswap.web.mnemonic.${SAMPLE_SEED_ADDRESS_1}`]: JSON.stringify({
            ciphertext: 'fail',
          }),
        },
      })

      const isUnlocked = await keyring.unlock(SAMPLE_PASSWORD)

      expect(isUnlocked).toBe(false)
    })

    it('fails when there are no saved mnemonics', async () => {
      const isUnlocked = await keyring.unlock(SAMPLE_PASSWORD)

      expect(isUnlocked).toBe(false)
    })
  })

  describe('retrieveMnemonicUnlocked', () => {
    const keyring = new WebKeyring()

    beforeEach(async () => {
      await keyring.importMnemonic(SAMPLE_SEED, SAMPLE_PASSWORD)
      await keyring.lock()
    })

    it('does not return mnemonic when password is incorrect', async () => {
      await keyring.unlock('fail')

      const action = async (): Promise<string> => {
        return keyring.retrieveMnemonicUnlocked(SAMPLE_SEED_ADDRESS_1)
      }

      await expect(action()).rejects.toThrow()
    })

    it('returns mnemonic when unlocked', async () => {
      await keyring.unlock(SAMPLE_PASSWORD)

      const mnemonic = await keyring.retrieveMnemonicUnlocked(SAMPLE_SEED_ADDRESS_1)
      expect(mnemonic).toEqual(SAMPLE_SEED)
    })
  })

  describe('removeAllMnemonicsAndPrivateKeys', () => {
    it('removes all mnemonics', async () => {
      const keyring = new WebKeyring()
      await keyring.importMnemonic(SAMPLE_SEED, SAMPLE_PASSWORD)
      await keyring.importMnemonic(SAMPLE_SEED, SAMPLE_PASSWORD)

      await keyring.removeAllMnemonicsAndPrivateKeys()

      const allMnemonics = await keyring.getMnemonicIds()
      expect(allMnemonics).toEqual([])
    })
  })

  describe('generateAddressesForMnemonicId', () => {
    beforeEach(() => {
      jest.spyOn(chrome.storage.session, 'get').mockImplementation(() => {
        return new Promise((resolve) => {
          resolve({ [ENCRYPTION_KEY_KEY]: base64EncryptionKey })
        })
      })
    })

    it('returns generated addresses from the mnemonicId when unlocked', async () => {
      const keyring = new WebKeyring()
      await keyring.importMnemonic(SAMPLE_SEED, SAMPLE_PASSWORD)
      await keyring.unlock(SAMPLE_PASSWORD)

      const addresses = await keyring.generateAddressesForMnemonicId(SAMPLE_SEED_ADDRESS_1, 0, 10)
      expect(addresses).toEqual([
        SAMPLE_SEED_ADDRESS_1,
        SAMPLE_SEED_ADDRESS_2,
        SAMPLE_SEED_ADDRESS_3,
        SAMPLE_SEED_ADDRESS_4,
        SAMPLE_SEED_ADDRESS_5,
        SAMPLE_SEED_ADDRESS_6,
        SAMPLE_SEED_ADDRESS_7,
        SAMPLE_SEED_ADDRESS_8,
        SAMPLE_SEED_ADDRESS_9,
        SAMPLE_SEED_ADDRESS_10,
      ])
    })

    it('errors when keyring is not unlocked', async () => {
      const keyring = new WebKeyring()
      await keyring.importMnemonic(SAMPLE_SEED, SAMPLE_PASSWORD)

      const action = async (): Promise<string[]> => {
        return keyring.generateAddressesForMnemonicId(SAMPLE_SEED_ADDRESS_1, 1, 0)
      }

      await expect(action()).rejects.toThrow()
    })

    it('errors when endDerivationIndex is not greater than startDerivationIndex', async () => {
      const keyring = new WebKeyring()
      await keyring.importMnemonic(SAMPLE_SEED, SAMPLE_PASSWORD)
      await keyring.unlock(SAMPLE_PASSWORD)

      const action = async (): Promise<string[]> => {
        return keyring.generateAddressesForMnemonicId(SAMPLE_SEED_ADDRESS_1, 0, 0)
      }

      await expect(action()).rejects.toThrow()
    })
  })
})
