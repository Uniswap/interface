import { by, element, expect } from 'detox'
import { TestWatchedWallet } from 'e2e/utils/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export async function WatchWallet(): Promise<void> {
  // Selects "Add an existing wallet" option on the landing screen
  await element(by.id(TestID.ImportAccount)).tap()

  // Picks Watch a wallet option on ImportMethodScreen
  await element(by.id(TestID.WatchWallet)).tap()

  // Checks if wallet name is in focus and types recovery phrase in
  await expect(element(by.id(TestID.ImportAccountInput))).toBeFocused()
  await element(by.id(TestID.ImportAccountInput)).typeText(TestWatchedWallet.ens)

  // Confirms the entered wallet name by tapping "continue"
  await element(by.id(TestID.Next)).tap()

  // Checks if Home screen is displayed with a proper user name
  await expect(element(by.text(TestWatchedWallet.displayName))).toBeVisible()
  await expect(element(by.id(TestID.Swap))).toBeVisible()
  await expect(element(by.id(TestID.SearchTokensAndWallets))).toBeVisible()
}
