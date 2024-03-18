import { by, element, expect } from 'detox'
import { TestWatchedWallet } from 'e2e/utils/fixtures'
import { ElementName } from 'wallet/src/telemetry/constants'

export async function SwapBasicInteractions(): Promise<void> {
  // Navigate to swap screen
  await element(by.id(ElementName.Swap)).tap()

  // Checks if currency input is selected
  await expect(element(by.id(ElementName.AmountInputIn))).toBeFocused()

  // Checks if "Max" button is available
  await expect(element(by.id(ElementName.SetMaxInput))).toBeVisible()

  // Opens token selector modal on Swap screen
  await element(by.id(ElementName.ChooseOutputToken)).tap()

  // Picks usdc output token
  await element(by.text('USDC')).atIndex(0).tap()

  // Taps 1234567890 number into swap input
  await element(by.id('decimal-pad-1')).tap()
  await element(by.id('decimal-pad-2')).tap()
  await element(by.id('decimal-pad-3')).tap()
  await element(by.id('decimal-pad-4')).tap()
  await element(by.id('decimal-pad-5')).tap()
  await element(by.id('decimal-pad-6')).tap()
  await element(by.id('decimal-pad-7')).tap()
  await element(by.id('decimal-pad-8')).tap()
  await element(by.id('decimal-pad-.')).tap()
  await element(by.id('decimal-pad-0')).tap()
  await element(by.id('decimal-pad-9')).tap()
  await element(by.id('decimal-pad-1')).tap()
  await element(by.id('decimal-pad-backspace')).tap()

  // Checks if expected input expected value: "12345678.09"
  await expect(element(by.id(ElementName.AmountInputIn))).toHaveValue('12345678.09')

  // Checks if expected error is displayed
  await expect(element(by.text('You don’t have enough ETH'))).toBeVisible()

  // Checks if expected output expected value: "0"
  await expect(element(by.id(ElementName.AmountInputOut))).not.toHaveValue('0')

  // Swaps input and output currencies
  await element(by.id(ElementName.SwitchCurrenciesButton)).tap()

  // Checks if expected input expected value: "0"
  await expect(element(by.id(ElementName.AmountInputIn))).toHaveValue('0')

  // Checks if expected error is displayed
  await expect(element(by.text('Not enough liquidity'))).toBeVisible()

  // Checks if expected output expected value: "12345678.09"
  await expect(element(by.id(ElementName.AmountInputOut))).toHaveValue('12345678.09')

  // Swaps input and output currencies
  await element(by.id(ElementName.SwitchCurrenciesButton)).tap()

  // Selects currency output
  await element(by.id(ElementName.AmountInputOut)).tap()

  // Clears the output field
  await element(by.id(ElementName.AmountInputOut)).clearText()

  await element(by.id('decimal-pad-1')).tap()
  await element(by.id('decimal-pad-2')).tap()
  await element(by.id('decimal-pad-3')).tap()

  // Checks if output has expected value: "123"
  await expect(element(by.id(ElementName.AmountInputOut))).toHaveValue('123')

  // Checks if expected input value to be cleared
  await expect(element(by.id(ElementName.AmountInputIn))).not.toHaveValue('0')

  // Checks dollar value to be visible
  await expect(element(by.text('$123.00'))).toBeVisible()

  // Swipes swap modal by dragging down SwapFormHeader
  await element(by.id(ElementName.SwapFormHeader)).swipe('down', 'fast', 0.75)

  // Checks if Home screen is visible and not covered
  await expect(element(by.text(TestWatchedWallet.displayName))).toBeVisible()
  await expect(element(by.id(ElementName.Swap))).toBeVisible()
  await expect(element(by.id(ElementName.SearchTokensAndWallets))).toBeVisible()
}
