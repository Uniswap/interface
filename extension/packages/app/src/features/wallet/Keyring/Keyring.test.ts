import { WebKeyring } from 'app/src/features/wallet/Keyring/Keyring.web'
import {
  SAMPLE_PASSWORD,
  SAMPLE_SEED,
  SAMPLE_SEED_ADDRESS_1,
} from 'app/src/test/__fixtures__'

jest.mock('./crypto')

const mockStore = async ({ data }: { data: Record<string, string> }) => {
  await chrome.storage.local.set(data)
}

describe(WebKeyring, () => {
  beforeEach(() => {
    chrome.storage.local.clear()
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

      const mnemonicId = await keyring.importMnemonic(
        SAMPLE_SEED,
        SAMPLE_PASSWORD
      )

      expect(mnemonicId).toEqual(SAMPLE_SEED_ADDRESS_1)
    })

    it('fails when mnemonic is not valid', async () => {
      const keyring = new WebKeyring()

      const action = async () => {
        return keyring.importMnemonic('invalid seed', SAMPLE_PASSWORD)
      }

      await expect(action()).rejects.toThrow()
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

      const action = () => keyring.unlock('fail')

      await expect(action()).rejects.toThrow()
    })

    it('fails when password is valid, but stored mnemonic is not', async () => {
      const keyring = new WebKeyring()
      await mockStore({
        data: {
          [`com.uniswap.web.mnemonic.${SAMPLE_SEED_ADDRESS_1}`]: JSON.stringify(
            {
              ciphertext: 'fail',
            }
          ),
        },
      })

      const action = () => keyring.unlock(SAMPLE_PASSWORD)

      await expect(action()).rejects.toThrow()
    })

    it('fails when there are no saved mnemonics', async () => {
      const keyring = new WebKeyring()

      const action = async () => {
        return keyring.unlock(SAMPLE_PASSWORD)
      }

      await expect(action()).rejects.toThrow()
    })
  })
})
