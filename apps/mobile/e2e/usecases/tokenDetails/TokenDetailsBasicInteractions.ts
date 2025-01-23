import { by, element, expect } from 'detox'
import { TestWatchedWallet } from 'e2e/utils/fixtures'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export async function TokenDetailsBasicInteractions(): Promise<void> {
  // Opens "explore" modal
  await element(by.id(TestID.SearchTokensAndWallets)).tap()

  // Types "Uniswap" into "explore" screen search bar
  await element(by.id(TestID.ExploreSearchInput)).typeText('Uniswap')

  // Opnes "Uniswap" Mainnet token details screen
  await element(by.id(`${TestID.SearchTokenItem}-Uniswap-${UniverseChainId.Mainnet}`)).tap()

  // checks if ethereum title is displayed
  await expect(element(by.id(TestID.TokenDetailsHeaderText))).toHaveText('Uniswap')

  // checks if portfolio balance is visible
  await expect(element(by.id(TestID.PriceExplorerAnimatedNumber))).toBeVisible()

  // checks if relative price indicator is visible
  await expect(element(by.id(TestID.RelativePriceChange))).toBeVisible()

  // opens header "more" button dropdown menu
  await expect(element(by.id(TestID.TokenDetailsMoreButton))).toBeVisible()

  // checks if send button is not available
  await expect(element(by.id(TestID.Send))).not.toBeVisible()

  // checks if price exploerer chart is rendered
  await expect(element(by.id(TestID.PriceExplorerChart))).toBeVisible()

  // checks if all time ranges renders properly
  await element(by.id('token-details-chart-time-range-button-1H')).tap()
  await expect(element(by.id(TestID.PriceExplorerChart))).toBeVisible()

  await element(by.id('token-details-chart-time-range-button-1W')).tap()
  await expect(element(by.id(TestID.PriceExplorerChart))).toBeVisible()

  await element(by.id('token-details-chart-time-range-button-1M')).tap()
  await expect(element(by.id(TestID.PriceExplorerChart))).toBeVisible()

  await element(by.id('token-details-chart-time-range-button-1Y')).tap()
  await expect(element(by.id(TestID.PriceExplorerChart))).toBeVisible()

  await element(by.id('token-details-chart-time-range-button-1D')).tap()
  await expect(element(by.id(TestID.PriceExplorerChart))).toBeVisible()

  // checks if sell and buy buttons are visible
  await expect(element(by.id(TestID.TokenDetailsBuyButton))).toBeVisible()
  await expect(element(by.id(TestID.TokenDetailsSellButton))).not.toBeVisible()

  // scrolls to the bottom of the token details screen
  await element(by.id(TestID.PriceExplorerChart)).swipe('up')

  // cheks if token detels share links are available
  await expect(element(by.id(TestID.TokenLinkEtherscan))).toBeVisible()
  await expect(element(by.id(TestID.TokenLinkWebsite))).toBeVisible()
  await expect(element(by.id(TestID.TokenLinkTwitter))).toBeVisible()

  // taps on buy button
  await element(by.id(TestID.TokenDetailsBuyButton)).tap()

  // checks if it is displayed as expected
  await expect(element(by.id(`${TestID.ChooseInputToken}-label`))).toHaveText('ETH')
  await expect(element(by.id(`${TestID.ChooseOutputToken}-label`))).toHaveText('UNI')
  await expect(element(by.id(TestID.ChooseInputToken))).toBeVisible()
  await expect(element(by.id(TestID.AmountInputOut))).toBeFocused()
  await expect(element(by.id(TestID.AmountInputOut))).toHaveText('')

  // closes swap modal
  await element(by.id(TestID.SwapFormHeader)).swipe('down')

  // tests descreption read more button
  await expect(element(by.id(TestID.ReadMoreButton))).toHaveText('Read more')
  await element(by.id(TestID.ReadMoreButton)).tap()

  await element(by.id(TestID.TokenDetailsAboutHeader)).swipe('up')

  // tests descreption read less button
  await expect(element(by.id(TestID.ReadMoreButton))).toHaveText('Read less')
  await element(by.id(TestID.ReadMoreButton)).tap()

  // navigates back to home screen
  await element(by.id(TestID.Back)).tap()

  // checks if home screen is rendered
  await expect(element(by.text(TestWatchedWallet.displayName))).toBeVisible()
  await expect(element(by.id(TestID.Swap))).toBeVisible()
  await expect(element(by.id(TestID.SearchTokensAndWallets))).toBeVisible()
}
