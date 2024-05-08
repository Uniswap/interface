import { by, element, expect } from 'detox'
import { TestWallet } from 'e2e/utils/fixtures'
import { ElementName } from 'wallet/src/telemetry/constants'

export async function CreateNewWallet(): Promise<void> {
  // Selects "Create a new wallet" option on the landing screen
  await element(by.id(ElementName.CreateAccount)).tap()

  // Skips unitag flow
  await element(by.id(ElementName.Skip)).tap()

  // Taps "Let's keep it safe" on QRAnimation screen
  await element(by.id(ElementName.Next)).tap()

  // Check is both manual and cloud backup options are available on BackupScreen
  await expect(element(by.id(ElementName.AddCloudBackup))).toBeVisible()
  await expect(element(by.id(ElementName.AddManualBackup))).toBeVisible()

  // Picks "Manual backup" option
  await element(by.id(ElementName.AddManualBackup)).tap()

  // Checks if ManualBackupScreen warning displays and taps "I'm ready" button
  await expect(element(by.id(ElementName.Confirm))).toBeVisible()
  await element(by.id(ElementName.Confirm)).tap()

  // Taps continue on ManualBackupScreen
  await element(by.id(ElementName.Next)).tap()

  // Taps continue on manual backup confirmation screen. It is replaced by mock because detox
  // can't interact with native screens
  await element(by.id(ElementName.Continue)).tap()

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
