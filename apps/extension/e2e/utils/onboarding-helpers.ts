import type { BrowserContext, Page } from '@playwright/test'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { sleep } from 'utilities/src/time/timing'

const TEST_PASSWORD = 'TestPassword123!'

export async function completeOnboarding(context: BrowserContext, existingOnboardingPage?: Page): Promise<void> {
  let onboardingPage: Page

  if (existingOnboardingPage) {
    onboardingPage = existingOnboardingPage
  } else {
    // Check if onboarding page is already open
    const pages = context.pages()
    const existingPage = pages.find((p) => p.url().includes('onboarding.html'))

    if (existingPage) {
      onboardingPage = existingPage
    } else {
      // Wait for onboarding page to open
      onboardingPage = await context.waitForEvent('page', {
        predicate: (page) => page.url().includes('onboarding.html'),
        timeout: 10000,
      })
    }
  }

  await onboardingPage.waitForLoadState('networkidle')

  // Based on thorough analysis, the Create flow is:
  // 1. IntroScreen -> Click "Create"
  // 2. ClaimUnitagScreen -> Skip unitag
  // 3. PasswordCreate -> Set password
  // 4. Complete -> Finish

  // Step 1: Click "Create" button on intro screen
  const createButton = onboardingPage.locator('button:has-text("Create")')
  await createButton.waitFor({ state: 'visible', timeout: 10000 })
  await createButton.click()

  // Wait for navigation
  await onboardingPage.waitForTimeout(1000)

  // Step 2: Handle unitag/username creation screen - click Skip
  // This comes BEFORE password in the create flow
  const skipButton = onboardingPage.locator('[data-testid="skip"]')
  if (await skipButton.isVisible({ timeout: 5000 })) {
    await skipButton.click()
    await onboardingPage.waitForTimeout(1000)
  }

  // Step 3: Set password (PasswordCreate screen)
  // Wait for password inputs to be visible
  const passwordInputs = onboardingPage.locator('input[type="password"]')
  await passwordInputs.first().waitFor({ state: 'visible', timeout: 10000 })

  // Fill both password fields
  await passwordInputs.first().fill(TEST_PASSWORD)
  await passwordInputs.nth(1).fill(TEST_PASSWORD)

  // Wait for form validation
  await onboardingPage.waitForTimeout(500)

  // Click continue button - wait for it to be enabled
  const passwordContinue = onboardingPage.locator('button:has-text("Continue")')
  await passwordContinue.waitFor({ state: 'visible' })

  // Wait for button to be enabled (after password validation)
  await onboardingPage.waitForFunction(
    () => {
      // Find button with "Continue" text
      const buttons = document.querySelectorAll('button')
      for (const button of buttons) {
        if (button.textContent?.includes('Continue') && !button.hasAttribute('disabled')) {
          return true
        }
      }
      return false
    },
    { timeout: 5000 },
  )

  await passwordContinue.click()
  await onboardingPage.waitForTimeout(1000)

  // Step 4: Complete onboarding
  // The final screen might have different button text
  const completeButton = onboardingPage
    .locator('button')
    .filter({
      hasText: /Get started|Continue|Done|Finish/i,
    })
    .first()

  if (await completeButton.isVisible({ timeout: 5000 })) {
    await completeButton.click()
  }

  // Wait for onboarding to complete and page to close or redirect
  await onboardingPage.waitForEvent('close', { timeout: 10000 }).catch(() => {
    // Page might redirect instead of closing
  })

  // Give extension time to initialize after onboarding
  await sleep(ONE_SECOND_MS * 2)
}
