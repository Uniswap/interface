import { by, element, expect } from 'detox'
import { TestWallet } from 'e2e/utils/fixtures'
import { ElementName } from 'wallet/src/telemetry/constants'

export async function ImportWallet(): Promise<void> {
  // Selects "Add an existing wallet" option on the landing screen
  await element(by.id(ElementName.ImportAccount)).tap()

  // Picks Import a wallet by recovery phase option
  await element(by.id(ElementName.OnboardingImportSeedPhrase)).tap()

  // Checks if recovery phase input is in focus and types recovery phrase in
  await expect(element(by.id(ElementName.ImportAccountInput))).toBeFocused()
  await element(by.id(ElementName.ImportAccountInput)).typeText(TestWallet.recoveryPhrase)

  // Taps continue navigating to SelectWalletScreen
  await element(by.id(ElementName.Continue)).tap()

  // Taps continue on SelectWalletScreen
  await waitFor(element(by.id(`${ElementName.WalletCard}-1`)))
    .toBeVisible()
    .withTimeout(10000)
  await element(by.id(ElementName.Next)).tap()

  // Skips cloud backup step on BackupScreen by clicking "Maybe later"
  await expect(element(by.id(ElementName.AddCloudBackup))).toBeVisible()
  await element(by.id(ElementName.Next)).tap()

  // Skips notification setup by tapping "Maybe later" button
  await element(by.id(ElementName.Skip)).tap()

  // Skips biometrics setup by tapping "Maybe later" button
  await element(by.id(ElementName.Skip)).tap()

  // Confirms by tapping "Skip" on warning modal
  await element(by.id(ElementName.Confirm)).tap()

  // Confirms if user successfuly finished create new wallet flow by checking if provided wallet name is
  // displayed and other
  await expect(element(by.text(TestWallet.name))).toBeVisible()
  await expect(element(by.id(ElementName.Swap))).toBeVisible()
  await expect(element(by.id(ElementName.SearchTokensAndWallets))).toBeVisible()
}
