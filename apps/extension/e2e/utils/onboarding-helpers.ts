import { expect, type BrowserContext, type Page } from '@playwright/test'
import { isVisibleWithin } from 'e2e/utils/locator-helpers'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { sleep } from 'utilities/src/time/timing'

export const TEST_PASSWORD = 'TestPassword123!'

/**
 * Canonical public Hardhat/Anvil dev mnemonic. Intentionally public and shared by every
 * local Ethereum dev environment — it must never hold real funds. Do NOT replace this with
 * any other mnemonic.
 */
export const TEST_SEED_PHRASE = 'test test test test test test test test test test test junk'

/** First account (m/44'/60'/0'/0/0) derived from {@link TEST_SEED_PHRASE}. */
export const TEST_WALLET_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

async function getOnboardingPage(context: BrowserContext, existingOnboardingPage?: Page): Promise<Page> {
  if (existingOnboardingPage) {
    return existingOnboardingPage
  }

  const existingPage = context.pages().find((p) => p.url().includes('onboarding.html'))
  if (existingPage) {
    return existingPage
  }

  return context.waitForEvent('page', {
    predicate: (page) => page.url().includes('onboarding.html'),
    timeout: ONE_SECOND_MS * 10,
  })
}

async function clickNextWhenEnabled(page: Page): Promise<void> {
  const nextButton = page.getByTestId(TestID.Next)
  await expect(nextButton).toBeEnabled({ timeout: ONE_SECOND_MS * 15 })
  await nextButton.click()
}

async function waitForOnboardingComplete(onboardingPage: Page): Promise<void> {
  // The Complete screen finalizes onboarding on mount; wait for it to render.
  await expect(onboardingPage.getByText('You’re all set')).toBeVisible({ timeout: ONE_SECOND_MS * 30 })

  // Give the extension time to activate accounts + persist state after onboarding.
  await sleep(ONE_SECOND_MS * 2)
}

/**
 * Completes onboarding by importing {@link TEST_SEED_PHRASE}, producing the same
 * deterministic wallet ({@link TEST_WALLET_ADDRESS}) on every run.
 */
export async function completeOnboardingViaImport(
  context: BrowserContext,
  options?: { existingOnboardingPage?: Page; seedPhrase?: string; password?: string },
): Promise<void> {
  const seedPhrase = options?.seedPhrase ?? TEST_SEED_PHRASE
  const password = options?.password ?? TEST_PASSWORD

  const onboardingPage = await getOnboardingPage(context, options?.existingOnboardingPage)
  await onboardingPage.waitForLoadState('domcontentloaded')

  // Navigate straight to the import route so the flow doesn't depend on
  // feature-flagged intro screen variants. Note: `new URL(...).origin` is "null" for
  // chrome-extension:// URLs, so build the URL from the page's own base URL instead.
  const baseUrl = onboardingPage.url().split('#')[0]
  await onboardingPage.goto(`${baseUrl}#/onboarding/import`)

  // Fill the recovery phrase word inputs.
  // The screen may render all 24 word inputs in the DOM with the 13-24 group collapsed
  // (and inert) until expanded, so don't assert an exact input count — wait for at least
  // enough inputs to mount, then fill the first N in DOM order (the visible ones).
  const words = seedPhrase.split(' ')
  const wordInputs = onboardingPage.locator('input')
  await wordInputs.first().waitFor({ state: 'visible', timeout: ONE_SECOND_MS * 10 })
  await expect
    .poll(async () => wordInputs.count(), { timeout: ONE_SECOND_MS * 10 })
    .toBeGreaterThanOrEqual(words.length)
  for (const [index, word] of words.entries()) {
    await wordInputs.nth(index).fill(word)
  }
  await clickNextWhenEnabled(onboardingPage)

  // Set the password.
  const passwordInputs = onboardingPage.locator('input[type="password"]')
  await passwordInputs.first().waitFor({ state: 'visible', timeout: ONE_SECOND_MS * 10 })
  await passwordInputs.first().fill(password)
  await passwordInputs.nth(1).fill(password)
  await clickNextWhenEnabled(onboardingPage)

  // Biometric unlock enrollment only appears on devices with a built-in sensor; skip it if shown.
  const skipButton = onboardingPage.getByTestId(TestID.Skip)
  if (await isVisibleWithin(skipButton, ONE_SECOND_MS)) {
    await skipButton.click()
  }

  // Select wallets screen: the first derived account is selected by default.
  await clickNextWhenEnabled(onboardingPage)

  await waitForOnboardingComplete(onboardingPage)
}

/**
 * Completes onboarding through the "create new wallet" flow. The resulting wallet is a
 * random one; use {@link completeOnboardingViaImport} when a deterministic address matters.
 */
export async function completeOnboarding(context: BrowserContext, existingOnboardingPage?: Page): Promise<void> {
  const onboardingPage = await getOnboardingPage(context, existingOnboardingPage)
  await onboardingPage.waitForLoadState('domcontentloaded')

  // The Create flow is:
  // 1. IntroScreen -> "Create" 2. ClaimUnitagScreen -> Skip 3. PasswordCreate 4. Complete

  const createButton = onboardingPage.getByTestId(TestID.CreateAccount)
  await createButton.waitFor({ state: 'visible', timeout: ONE_SECOND_MS * 10 })
  await createButton.click()

  // Skip unitag/username creation.
  const skipButton = onboardingPage.getByTestId(TestID.Skip)
  if (await isVisibleWithin(skipButton, ONE_SECOND_MS * 5)) {
    await skipButton.click()
  }

  // Set the password.
  const passwordInputs = onboardingPage.locator('input[type="password"]')
  await passwordInputs.first().waitFor({ state: 'visible', timeout: ONE_SECOND_MS * 10 })
  await passwordInputs.first().fill(TEST_PASSWORD)
  await passwordInputs.nth(1).fill(TEST_PASSWORD)
  await clickNextWhenEnabled(onboardingPage)

  await waitForOnboardingComplete(onboardingPage)
}
