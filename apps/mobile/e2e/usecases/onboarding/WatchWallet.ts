import { by, element, expect } from 'detox'
import { TestWatchedWallet } from 'e2e/utils/fixtures'
import { ElementName } from 'wallet/src/telemetry/constants'

export async function WatchWallet(): Promise<void> {
  // Selects "Add an existing wallet" option on the landing screen
  await element(by.id(ElementName.ImportAccount)).tap()

  // Picks Watch a wallet option on ImportMethodScreen
  await element(by.id(ElementName.WatchWallet)).tap()

  // Checks if wallet name is in focus and types recovery phrase in
  await expect(element(by.id(ElementName.ImportAccountInput))).toBeFocused()
  await element(by.id(ElementName.ImportAccountInput)).typeText(TestWatchedWallet.ens)

  // Confirms the entered wallet name by tapping "continue"
  await element(by.id(ElementName.Next)).tap()

  // Checks if Home screen is displayed with a proper user name
  await expect(element(by.text(TestWatchedWallet.displayName))).toBeVisible()
  await expect(element(by.id(ElementName.Swap))).toBeVisible()
  await expect(element(by.id(ElementName.SearchTokensAndWallets))).toBeVisible()
}
