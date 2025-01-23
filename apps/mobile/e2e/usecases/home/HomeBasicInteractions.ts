import { by, element, expect } from 'detox'
import { TestWatchedWallet } from 'e2e/utils/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export async function HomeBasicInteractions(): Promise<void> {
  await expect(element(by.text(TestWatchedWallet.displayName))).toBeVisible()
  await expect(element(by.id(TestID.Swap))).toBeVisible()
  await expect(element(by.id(TestID.SearchTokensAndWallets))).toBeVisible()

  // opens AccountSwitcherModal by clicking on account avatar
  await expect(element(by.id(TestID.AccountHeaderAvatar))).toBeVisible()

  // checks if portfolio balance is visible
  await expect(element(by.id(TestID.PortfolioBalance))).toBeVisible()

  // copies wallet address from AccountSwitcherModal
  await element(by.id(TestID.AccountHeaderCopyAddress)).tap()

  // checks if notification toast is visible with title "Address copied"
  await expect(element(by.id(TestID.NotificationToastTitle))).toBeVisible()
  await expect(element(by.id(TestID.NotificationToastTitle))).toHaveText('Address copied')

  // checks if list was rendered properly by checking if the first item is visible
  await expect(element(by.id('token-list-item-0'))).toBeVisible()

  // scrolls to the bottom of the token list
  await element(by.id('token-list-item-0')).swipe('up')

  // checks if only tabs headers are visible then scrolled to bottom
  await expect(element(by.id(TestID.AccountHeaderAvatar))).not.toBeVisible()
  await expect(element(by.id(TestID.PortfolioBalance))).not.toBeVisible()
  // for some reason react-native-tab-view renders headers twice, thats why first matching item was picked
  await expect(element(by.id('home-tab-Tokens')).atIndex(0)).toBeVisible()
  await expect(element(by.id('home-tab-NFTs')).atIndex(0)).toBeVisible()
  await expect(element(by.id('home-tab-Activity')).atIndex(0)).toBeVisible()

  // checks if the first item of hidden list is not visible
  await expect(element(by.id('token-list-item-0'))).not.toBeVisible()

  // hidden item does not exist
  await expect(element(by.id('token-list-item-25'))).not.toExist()

  // taps on "show" button to show hidden elements
  await element(by.id(TestID.ShowHiddenTokens)).tap()

  // checks if first hidden element is visible
  await expect(element(by.id('token-list-item-25'))).toExist()

  // taps on "hide" button to show hidden elements
  await element(by.id(TestID.ShowHiddenTokens)).tap()

  // checks if first item of the hidden item is not visible again
  await expect(element(by.id('token-list-item-25'))).not.toExist()

  // switches to NFTs tab
  await element(by.id('home-tab-NFTs')).atIndex(0).tap()

  // checks is if tokens are visible
  await expect(element(by.id('nfts-list-item-0'))).toBeVisible()

  // switches to Activity tab
  await element(by.id('home-tab-Activity')).atIndex(0).tap()

  // checks is if tokens are visible
  await expect(element(by.id('activity-list-item-0'))).toBeVisible()

  // switches back to tokens tab
  await element(by.id('home-tab-Tokens')).atIndex(0).tap()

  // scrolls to the bottom of the token list
  await element(by.id('token-list-item-16')).swipe('down')

  // checks if list of tokens was rendered properly by checking first token visibility
  await expect(element(by.id('token-list-item-0'))).toBeVisible()
}
