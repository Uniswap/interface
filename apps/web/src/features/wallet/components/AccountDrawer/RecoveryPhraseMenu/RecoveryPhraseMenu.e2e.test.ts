import { TestID } from '@universe/test'
import { expect, getTest } from '~/playwright/fixtures'
import {
  EMBEDDED_WALLET_URL_PARAMS,
  rpcSequence,
  setupEmbeddedWallet,
  setupExportSeedPhraseMock,
} from '~/playwright/fixtures/embeddedWallet'
import { getVisibleDropdownElementByTestId } from '~/playwright/fixtures/utils'

const test = getTest()

const TEST_SEED_PHRASE = 'test test test test test test test test test test test junk'
/** SPKI DER for an uncompressed P-256 public key. */
const P256_SPKI_LENGTH = 91

// Export always runs the interactive passkey (no device-session variant): Challenge(EXPORT_SEED_PHRASE)
// with the client's ephemeral HPKE key, the WebAuthn assertion, then ExportSeedPhrase returning the
// phrase sealed to that key. The words on screen prove the round trip decrypted.
test.describe(
  'Recovery phrase export via embedded wallet',
  {
    tag: '@team:apps-infra',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-infra' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('exports and reveals the recovery phrase after the passkey ceremony', async ({ page }) => {
      const embeddedWallet = await setupEmbeddedWallet(page)
      await setupExportSeedPhraseMock({ page, harness: embeddedWallet, seedPhrase: TEST_SEED_PHRASE })

      await page.goto(`/swap?${EMBEDDED_WALLET_URL_PARAMS}`)
      await page.getByTestId(TestID.Web3StatusConnected).click()
      await getVisibleDropdownElementByTestId(page, TestID.WalletSettings).click()
      await getVisibleDropdownElementByTestId(page, TestID.WalletSettingsRecoveryPhrase).click()

      const drawer = page.getByTestId(TestID.AccountDrawer)
      await drawer.getByRole('button', { name: 'Continue on web' }).click()
      await drawer.getByRole('button', { name: 'View recovery phrase' }).click()
      await drawer.getByRole('button', { name: 'Show' }).click()
      // Every word in order and nothing extra: the phrase on screen is the one the mock sealed.
      const words = TEST_SEED_PHRASE.split(' ')
      await expect(drawer.locator(`[data-testid^="${TestID.RecoveryPhraseWordPrefix}"]`)).toHaveCount(words.length)
      for (const [index, word] of words.entries()) {
        await expect(drawer.getByTestId(`${TestID.RecoveryPhraseWordPrefix}${index}`)).toHaveText(word)
      }

      expect(rpcSequence(embeddedWallet)).toEqual(['Challenge:EXPORT_SEED_PHRASE', 'ExportSeedPhrase'])
      const challenge = embeddedWallet.rpcCalls.find((call) => call.action === 'EXPORT_SEED_PHRASE')?.body
      const exportRequest = embeddedWallet.rpcCalls.find((call) => call.rpc === 'ExportSeedPhrase')?.body
      expect(exportRequest?.encryptionKey).toBe(challenge?.encryptionKey)
      expect(Buffer.from(String(exportRequest?.encryptionKey), 'base64')).toHaveLength(P256_SPKI_LENGTH)
      expect(String(exportRequest?.credential).length).toBeGreaterThan(0)
      expect(embeddedWallet.signedTransactions).toHaveLength(0)
      expect(embeddedWallet.signedTypedData).toHaveLength(0)
    })
  },
)
