import { by, element, expect } from 'detox'
import { TestWatchedWallet } from 'e2e/utils/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export async function SwapBasicInteractions(): Promise<void> {
  // Navigate to swap screen
  await element(by.id(TestID.Swap)).tap()

  // Checks if currency input is selected
  await expect(element(by.id(TestID.AmountInputIn))).toBeFocused()

  // Checks if "Max" button is available
  await expect(element(by.id(TestID.SetMaxInput))).toBeVisible()

  // Opens token selector modal on Swap screen
  await element(by.id(TestID.ChooseOutputToken)).tap()

  // Picks usdc output token
  await element(by.text('USDC')).atIndex(0).tap()

  // Taps .98765432101 into the swap input
  await element(by.id('decimal-pad-.')).tap()
  await element(by.id('decimal-pad-9')).tap()
  await element(by.id('decimal-pad-8')).tap()
  await element(by.id('decimal-pad-7')).tap()
  await element(by.id('decimal-pad-6')).tap()
  await element(by.id('decimal-pad-5')).tap()
  await element(by.id('decimal-pad-4')).tap()
  await element(by.id('decimal-pad-3')).tap()
  await element(by.id('decimal-pad-2')).tap()
  await element(by.id('decimal-pad-1')).tap()
  await element(by.id('decimal-pad-0')).tap()
  await element(by.id('decimal-pad-1')).tap()

  // Taps a backspace button leaving .9876543210 value in the input field
  await element(by.id('decimal-pad-backspace')).tap()

  // Checks if expected input expected value: ".9876543210"
  await expect(element(by.id(TestID.AmountInputIn))).toHaveText('.9876543210')

  // Checks if expected error is displayed
  await expect(element(by.text('You don’t have enough ETH'))).toBeVisible()

  // Checks if expected output expected value: "0"
  await expect(element(by.id(TestID.AmountInputOut))).not.toHaveText('0')

  // Swaps input and output currencies
  await element(by.id(TestID.SwitchCurrenciesButton)).tap()

  // Checks if expected input expected value: "0"
  await expect(element(by.id(TestID.AmountInputIn))).not.toHaveText('0')

  // Checks if expected error is displayed
  await expect(element(by.text('You don’t have enough USDC'))).toBeVisible()

  // Checks if expected output expected value: ".9876543210"
  await expect(element(by.id(TestID.AmountInputOut))).toHaveText('.9876543210')

  // Swaps input and output currencies
  await element(by.id(TestID.SwitchCurrenciesButton)).tap()

  // Selects currency output
  await element(by.id(TestID.AmountInputOut)).tap()

  // Clears the output field
  await element(by.id(TestID.AmountInputOut)).clearText()

  await element(by.id('decimal-pad-1')).tap()
  await element(by.id('decimal-pad-2')).tap()
  await element(by.id('decimal-pad-3')).tap()

  // Checks if output has expected value: "123"
  await expect(element(by.id(TestID.AmountInputOut))).toHaveText('123')

  // Checks if expected input value to be cleared
  await expect(element(by.id(TestID.AmountInputIn))).not.toHaveText('0')

  // Checks dollar value to be visible
  await expect(element(by.text('$123.00'))).toBeVisible()

  // Swipes swap modal by dragging down SwapFormHeader
  await element(by.id(TestID.SwapFormHeader)).swipe('down', 'fast', 0.75)

  // Checks if Home screen is visible and not covered
  await expect(element(by.text(TestWatchedWallet.displayName))).toBeVisible()
  await expect(element(by.id(TestID.Swap))).toBeVisible()
  await expect(element(by.id(TestID.SearchTokensAndWallets))).toBeVisible()
}
