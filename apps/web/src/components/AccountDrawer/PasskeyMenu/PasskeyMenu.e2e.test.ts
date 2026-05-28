import { FeatureFlags, getFeatureFlagName } from '@universe/gating'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest } from '~/playwright/fixtures'
import { getVisibleDropdownElementByTestId } from '~/playwright/fixtures/utils'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'
import { Mocks } from '~/playwright/mocks/mocks'

const test = getTest()

const EW_ENABLED = `featureFlagOverride=${getFeatureFlagName(FeatureFlags.EmbeddedWallet)}`

const LIST_AUTHENTICATORS_URL = '**/uniswap.privyembeddedwallet.v1.EmbeddedWalletService/ListAuthenticators'
const CHALLENGE_URL = '**/uniswap.privyembeddedwallet.v1.EmbeddedWalletService/Challenge'
const WALLET_SIGNIN_URL = '**/uniswap.privyembeddedwallet.v1.EmbeddedWalletService/WalletSignIn'
const START_AUTHENTICATED_SESSION_URL =
  '**/uniswap.privyembeddedwallet.v1.EmbeddedWalletService/StartAuthenticatedSession'
const ADD_AUTHENTICATOR_URL = '**/uniswap.privyembeddedwallet.v1.EmbeddedWalletService/AddAuthenticator'
const PREPARE_ADD_AUTHENTICATOR_URL = '**/uniswap.privyembeddedwallet.v1.EmbeddedWalletService/PrepareAddAuthenticator'
const DELETE_AUTHENTICATOR_URL = '**/uniswap.privyembeddedwallet.v1.EmbeddedWalletService/DeleteAuthenticator'

const TEST_WALLET_ID = 'test-wallet-id'

/** Sets embedded wallet state in localStorage before page navigation */
async function setupEmbeddedWalletState(page: Awaited<Parameters<Parameters<typeof test>[2]>[0]>['page']) {
  await page.addInitScript(
    ({ walletId, walletAddress }) => {
      localStorage.setItem(
        'embedded-wallet',
        JSON.stringify({
          walletId,
          walletAddress,
          chainId: 1,
          isConnected: true,
        }),
      )
    },
    { walletId: TEST_WALLET_ID, walletAddress: TEST_WALLET_ADDRESS },
  )
}

/** Navigates to the Passkey menu via Settings */
async function navigateToPasskeyMenu(page: Awaited<Parameters<Parameters<typeof test>[2]>[0]>['page']) {
  await page.getByTestId(TestID.Web3StatusConnected).click()
  await getVisibleDropdownElementByTestId(page, TestID.WalletSettings).click()
  await getVisibleDropdownElementByTestId(page, TestID.PasskeySettings).click()
}

/**
 * Mocks navigator.credentials at the browser level to simulate WebAuthn responses.
 * Uses page.addInitScript so it runs before any app code loads.
 * Avoids dependency on CDP WebAuthn protocol for reliability.
 */
async function setupWebAuthnMock(
  page: Awaited<Parameters<Parameters<typeof test>[2]>[0]>['page'],
  credentialId = 'cred-icloud-1',
) {
  await page.addInitScript((credId) => {
    const emptyBuf = new Uint8Array([0]).buffer

    // Mock authentication (get) — returns a fake assertion
    const mockGetResult = {
      id: credId,
      rawId: emptyBuf,
      type: 'public-key' as const,
      authenticatorAttachment: 'platform' as const,
      getClientExtensionResults: () => ({}),
      response: {
        clientDataJSON: emptyBuf,
        authenticatorData: emptyBuf,
        signature: emptyBuf,
        userHandle: null,
      },
    }

    // Mock registration (create) — returns a fake attestation
    const mockCreateResult = {
      id: 'new-cred-id-test',
      rawId: emptyBuf,
      type: 'public-key' as const,
      authenticatorAttachment: 'platform' as const,
      getClientExtensionResults: () => ({}),
      response: {
        clientDataJSON: emptyBuf,
        attestationObject: emptyBuf,
        getTransports: () => ['hybrid'],
        getPublicKey: () => emptyBuf,
        getPublicKeyAlgorithm: () => -7,
        getAuthenticatorData: () => emptyBuf,
      },
    }

    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: {
        get: async () => mockGetResult,
        create: async () => mockCreateResult,
        preventSilentAccess: async () => {},
      },
    })
  }, credentialId)
}

/** Minimal challenge options for passkey authentication (startAuthentication) */
const AUTH_CHALLENGE_RESPONSE = JSON.stringify({
  challengeOptions: JSON.stringify({
    challenge: 'dGVzdC1jaGFsbGVuZ2U', // base64url "test-challenge"
    timeout: 60000,
    rpId: 'localhost',
    allowCredentials: [{ id: 'Y3JlZC1pY2xvdWQtMQ', type: 'public-key' }],
    userVerification: 'required',
  }),
})

/** Minimal challenge options for passkey registration (startRegistration) */
const REGISTRATION_CHALLENGE_RESPONSE = JSON.stringify({
  challengeOptions: JSON.stringify({
    challenge: 'dGVzdC1jaGFsbGVuZ2U', // base64url "test-challenge"
    rp: { name: 'Uniswap', id: 'localhost' },
    user: { id: 'dXNlcg', name: 'testuser', displayName: 'Test User' },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    timeout: 60000,
    attestation: 'none',
  }),
  existingPublicKeys: [],
  keyQuorumId: 'test-key-quorum-id',
})

/**
 * NECK device session challenge response for LIST_AUTHENTICATORS.
 * sessionActive=true skips the refreshNeckSession re-entry in listAuthenticators.
 */
const NECK_LIST_CHALLENGE_RESPONSE = JSON.stringify({
  sessionActive: true,
  signingPayload: 'dGVzdC1zaWduaW5nLXBheWxvYWQ', // base64url "test-signing-payload"
})

/**
 * Sets up NECK device-session mocks needed for all tests because listAuthenticators
 * now calls Challenge(WALLET_SIGNIN) + WalletSignIn before the actual list RPC.
 */
async function setupNeckMocks(
  page: Awaited<Parameters<Parameters<typeof test>[2]>[0]>['page'],
  credentialId = 'cred-icloud-1',
) {
  await setupWebAuthnMock(page, credentialId)
  await page.route(WALLET_SIGNIN_URL, async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({}) })
  })
}

/**
 * Route handler that dispatches Challenge responses based on the request action.
 * LIST_AUTHENTICATORS → NECK device-session response (sessionActive=true).
 * PASSKEY_REGISTRATION type → registration challenge (for registerNewAuthenticator).
 * All other actions → standard auth challenge (WALLET_SIGNIN, DELETE_AUTHENTICATOR, etc.).
 */
async function setupNeckAwareChallengeRoute(page: Awaited<Parameters<Parameters<typeof test>[2]>[0]>['page']) {
  await page.route(CHALLENGE_URL, async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>
    if (body.action === 'LIST_AUTHENTICATORS') {
      await route.fulfill({ contentType: 'application/json', body: NECK_LIST_CHALLENGE_RESPONSE })
    } else if (body.type === 'PASSKEY_REGISTRATION') {
      await route.fulfill({ contentType: 'application/json', body: REGISTRATION_CHALLENGE_RESPONSE })
    } else {
      await route.fulfill({ contentType: 'application/json', body: AUTH_CHALLENGE_RESPONSE })
    }
  })
}

test.describe(
  'PasskeyMenu',
  {
    tag: '@team:apps-infra',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-infra' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('shows authenticators after API response', async ({ page }) => {
      await setupEmbeddedWalletState(page)
      await setupNeckMocks(page)
      await setupNeckAwareChallengeRoute(page)

      await page.route(LIST_AUTHENTICATORS_URL, async (route) => {
        await route.fulfill({ path: Mocks.EmbeddedWallet.list_authenticators_multi })
      })

      await page.goto(`/swap?${EW_ENABLED}`)
      await navigateToPasskeyMenu(page)

      const drawer = page.getByTestId(TestID.AccountDrawer)
      await expect(drawer.getByText('iCloud')).toBeVisible()
      await expect(drawer.getByText('Chrome')).toBeVisible()
      await expect(drawer.getByRole('button', { name: /add a passkey/i })).toBeVisible()
    })

    test('shows loading skeletons while fetching', async ({ page }) => {
      await setupEmbeddedWalletState(page)
      await setupNeckMocks(page)
      await setupNeckAwareChallengeRoute(page)

      // Delay the response so we can observe loading state
      await page.route(LIST_AUTHENTICATORS_URL, async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        await route.fulfill({ path: Mocks.EmbeddedWallet.list_authenticators_multi })
      })

      await page.goto(`/swap?${EW_ENABLED}`)
      await navigateToPasskeyMenu(page)

      // While the request is in-flight, skeleton rows should be visible
      const skeletons = page.locator(`[data-testid="${TestID.PasskeyLoadingRow}"]`)
      await expect(skeletons.first()).toBeVisible()
    })

    test('opens delete passkey speedbump when trash icon is clicked', async ({ page }) => {
      await setupEmbeddedWalletState(page)
      await setupNeckMocks(page)
      await setupNeckAwareChallengeRoute(page)

      await page.route(LIST_AUTHENTICATORS_URL, async (route) => {
        await route.fulfill({ path: Mocks.EmbeddedWallet.list_authenticators_multi })
      })

      await page.goto(`/swap?${EW_ENABLED}`)
      await navigateToPasskeyMenu(page)

      const drawer = page.getByTestId(TestID.AccountDrawer)

      await expect(drawer.getByText('iCloud')).toBeVisible()
      await drawer.getByText('iCloud').hover()

      const trashButtons = page.locator(`[data-testid="${TestID.DeletePasskey}"]`)
      await expect(trashButtons.first()).toBeVisible()
      await trashButtons.first().dispatchEvent('click')
      await page.getByText('Remove').click()
      await expect(page.getByText('Make sure you have a backup')).toBeVisible()
    })

    test('hides delete affordance when only one authenticator exists', async ({ page }) => {
      await setupEmbeddedWalletState(page)
      await setupNeckMocks(page)
      await setupNeckAwareChallengeRoute(page)

      await page.route(LIST_AUTHENTICATORS_URL, async (route) => {
        await route.fulfill({ path: Mocks.EmbeddedWallet.list_authenticators_single })
      })

      await page.goto(`/swap?${EW_ENABLED}`)
      await navigateToPasskeyMenu(page)

      const drawer = page.getByTestId(TestID.AccountDrawer)
      await expect(drawer.getByText('iCloud')).toBeVisible()

      // Hovering must not surface the overflow/delete affordance: removing the
      // last passkey would lock the user out, so the row is read-only.
      await drawer.getByText('iCloud').hover()
      await expect(page.locator(`[data-testid="${TestID.DeletePasskey}"]`)).toHaveCount(0)
    })

    test('successfully adds a new passkey', async ({ page }) => {
      await setupEmbeddedWalletState(page)
      await setupNeckMocks(page)

      let listAuthenticatorsCallCount = 0

      await page.route(LIST_AUTHENTICATORS_URL, async (route) => {
        listAuthenticatorsCallCount++
        // First call: single authenticator. Subsequent calls (refresh): two authenticators.
        const mockPath =
          listAuthenticatorsCallCount === 1
            ? Mocks.EmbeddedWallet.list_authenticators_single
            : Mocks.EmbeddedWallet.list_authenticators_multi
        await route.fulfill({ path: mockPath })
      })

      await setupNeckAwareChallengeRoute(page)

      await page.route(START_AUTHENTICATED_SESSION_URL, async (route) => {
        await route.fulfill({ path: Mocks.EmbeddedWallet.start_authenticated_session })
      })

      await page.route(ADD_AUTHENTICATOR_URL, async (route) => {
        await route.fulfill({ path: Mocks.EmbeddedWallet.add_authenticator })
      })

      await page.goto(`/swap?${EW_ENABLED}`)
      await navigateToPasskeyMenu(page)

      const drawer = page.getByTestId(TestID.AccountDrawer)
      await expect(drawer.getByText('iCloud')).toBeVisible()

      // Click "Add passkey" — this opens the verify passkey modal
      await drawer.getByRole('button', { name: /add a passkey/i }).click()
      await expect(page.getByText('Passkey required')).toBeVisible()

      // Click the verify button — triggers authenticateWithPasskey (uses mocked navigator.credentials.get)
      await page.getByRole('button', { name: /sign in with passkey/i }).click()

      // After verification, the AddPasskeyMenu should open showing authenticator type selection
      await expect(page.getByText('This device')).toBeVisible()

      // Click "This device" — triggers registerNewAuthenticator
      await page.getByText('This device').click()

      // After successful add, menu returns to list with two passkeys
      await expect(drawer.getByText('iCloud')).toBeVisible()
      await expect(drawer.getByText('Chrome')).toBeVisible()
    })

    test('calls StartAuthenticatedSession before AddAuthenticator', async ({ page }) => {
      await setupEmbeddedWalletState(page)
      await setupNeckMocks(page)

      const callOrder: string[] = []

      await page.route(LIST_AUTHENTICATORS_URL, async (route) => {
        await route.fulfill({ path: Mocks.EmbeddedWallet.list_authenticators_single })
      })

      await setupNeckAwareChallengeRoute(page)

      await page.route(START_AUTHENTICATED_SESSION_URL, async (route) => {
        callOrder.push('StartAuthenticatedSession')
        await route.fulfill({ path: Mocks.EmbeddedWallet.start_authenticated_session })
      })

      await page.route(PREPARE_ADD_AUTHENTICATOR_URL, async (route) => {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ signingPayload: 'mock-signing-payload' }),
        })
      })

      await page.route(ADD_AUTHENTICATOR_URL, async (route) => {
        callOrder.push('AddAuthenticator')
        await route.fulfill({ path: Mocks.EmbeddedWallet.add_authenticator })
      })

      await page.goto(`/swap?${EW_ENABLED}`)
      await navigateToPasskeyMenu(page)

      const drawer = page.getByTestId(TestID.AccountDrawer)
      await expect(drawer.getByText('iCloud')).toBeVisible()
      await drawer.getByRole('button', { name: /add a passkey/i }).click()
      await expect(page.getByText('Passkey required')).toBeVisible()
      await page.getByRole('button', { name: /sign in with passkey/i }).click()
      await expect(page.getByText('This device')).toBeVisible()
      await page.getByText('This device').click()

      // endsWith — substring match would also catch the PrepareAddAuthenticator response
      await page.waitForResponse((resp) => resp.url().endsWith('/AddAuthenticator'))

      expect(callOrder).toEqual(['StartAuthenticatedSession', 'AddAuthenticator'])
    })

    test('Challenge request for delete uses DELETE_AUTHENTICATOR action and authenticatorId', async ({ page }) => {
      await setupEmbeddedWalletState(page)
      await setupNeckMocks(page, 'cred-icloud-1')

      // Only capture the DELETE_AUTHENTICATOR challenge (NECK adds WALLET_SIGNIN + LIST_AUTHENTICATORS before it)
      let capturedChallengeBody: Record<string, unknown> | undefined

      await page.route(LIST_AUTHENTICATORS_URL, async (route) => {
        await route.fulfill({ path: Mocks.EmbeddedWallet.list_authenticators_multi })
      })

      await page.route(CHALLENGE_URL, async (route) => {
        const body = route.request().postDataJSON() as Record<string, unknown>
        if (body.action === 'LIST_AUTHENTICATORS') {
          await route.fulfill({ contentType: 'application/json', body: NECK_LIST_CHALLENGE_RESPONSE })
        } else {
          if (body.action === 'DELETE_AUTHENTICATOR') {
            capturedChallengeBody = body
          }
          await route.fulfill({ contentType: 'application/json', body: AUTH_CHALLENGE_RESPONSE })
        }
      })

      await page.goto(`/swap?${EW_ENABLED}`)
      await navigateToPasskeyMenu(page)

      const drawer = page.getByTestId(TestID.AccountDrawer)
      await expect(drawer.getByText('iCloud')).toBeVisible()
      await drawer.getByText('iCloud').hover()

      const trashButtons = page.locator(`[data-testid="${TestID.DeletePasskey}"]`)
      await trashButtons.first().dispatchEvent('click')
      await page.getByText('Remove').click()

      await expect(page.getByText('Make sure you have a backup')).toBeVisible()
      await page.getByRole('button', { name: /continue/i }).click()
      await page.getByTestId(TestID.DeletePasskeyAcknowledge).click()

      // Subscribe before clicking to avoid losing the response to a race
      const challengeResponsePromise = page.waitForResponse((resp) => resp.url().includes('Challenge'))
      await page.getByRole('button', { name: /^delete$/i }).click()
      await challengeResponsePromise

      // Action enum is serialized as string name in protobuf JSON — assert DELETE_AUTHENTICATOR, not DELETE_RECORD
      expect(capturedChallengeBody?.action).toBe('DELETE_AUTHENTICATOR')
      expect(capturedChallengeBody?.authenticatorId).toBeDefined()
    })

    test('successfully deletes a non-last passkey', async ({ page }) => {
      await setupEmbeddedWalletState(page)
      await setupNeckMocks(page)

      let listCallCount = 0

      await page.route(LIST_AUTHENTICATORS_URL, async (route) => {
        listCallCount++
        // First call: 2 passkeys. After deletion refresh: 1 passkey.
        const mockPath =
          listCallCount === 1
            ? Mocks.EmbeddedWallet.list_authenticators_multi
            : Mocks.EmbeddedWallet.list_authenticators_single
        await route.fulfill({ path: mockPath })
      })

      await setupNeckAwareChallengeRoute(page)

      await page.route(DELETE_AUTHENTICATOR_URL, async (route) => {
        await route.fulfill({ path: Mocks.EmbeddedWallet.delete_authenticator })
      })

      await page.goto(`/swap?${EW_ENABLED}`)
      await navigateToPasskeyMenu(page)

      const drawer = page.getByTestId(TestID.AccountDrawer)
      await expect(drawer.getByText('iCloud')).toBeVisible()
      await expect(drawer.getByText('Chrome')).toBeVisible()

      await drawer.getByText('iCloud').hover()
      const trashButtons = page.locator(`[data-testid="${TestID.DeletePasskey}"]`)
      await trashButtons.first().dispatchEvent('click')
      await page.getByText('Remove').click()

      await expect(page.getByText('Make sure you have a backup')).toBeVisible()
      await page.getByRole('button', { name: /continue/i }).click()

      // Acknowledge checkbox must be checked to enable the Delete button
      await expect(page.getByRole('button', { name: /^delete$/i })).toBeDisabled()
      await page.getByTestId(TestID.DeletePasskeyAcknowledge).click()
      await expect(page.getByRole('button', { name: /^delete$/i })).toBeEnabled()
      const deleteResponsePromise = page.waitForResponse((resp) => resp.url().includes('DeleteAuthenticator'))
      await page.getByRole('button', { name: /^delete$/i }).click()
      await deleteResponsePromise
      await expect(drawer.getByText('iCloud')).toBeVisible()
      await expect(drawer.getByText('Chrome')).not.toBeVisible()
    })

    test('shows delete speedbump warning before the delete confirmation', async ({ page }) => {
      await setupEmbeddedWalletState(page)
      await setupNeckMocks(page)
      await setupNeckAwareChallengeRoute(page)

      await page.route(LIST_AUTHENTICATORS_URL, async (route) => {
        await route.fulfill({ path: Mocks.EmbeddedWallet.list_authenticators_multi })
      })

      await page.goto(`/swap?${EW_ENABLED}`)
      await navigateToPasskeyMenu(page)

      const drawer = page.getByTestId(TestID.AccountDrawer)
      await expect(drawer.getByText('iCloud')).toBeVisible()
      await drawer.getByText('iCloud').hover()

      const trashButtons = page.locator(`[data-testid="${TestID.DeletePasskey}"]`)
      await trashButtons.first().dispatchEvent('click')
      await page.getByText('Remove').click()

      await expect(page.getByText('Make sure you have a backup')).toBeVisible()
      await page.getByRole('button', { name: /continue/i }).click()
      await expect(page.getByText('Delete passkey')).toBeVisible()
    })

    test('deleting a non-last passkey keeps the wallet connected', async ({ page }) => {
      await setupEmbeddedWalletState(page)
      await setupNeckMocks(page)

      let listCallCount = 0
      await page.route(LIST_AUTHENTICATORS_URL, async (route) => {
        listCallCount++
        // First call: 2 passkeys. After deletion refresh: 1 passkey.
        const mockPath =
          listCallCount === 1
            ? Mocks.EmbeddedWallet.list_authenticators_multi
            : Mocks.EmbeddedWallet.list_authenticators_single
        await route.fulfill({ path: mockPath })
      })

      await setupNeckAwareChallengeRoute(page)

      await page.route(DELETE_AUTHENTICATOR_URL, async (route) => {
        await route.fulfill({ path: Mocks.EmbeddedWallet.delete_authenticator })
      })

      await page.goto(`/swap?${EW_ENABLED}`)
      await navigateToPasskeyMenu(page)

      const drawer = page.getByTestId(TestID.AccountDrawer)
      await expect(drawer.getByText('iCloud')).toBeVisible()
      await drawer.getByText('iCloud').hover()

      const trashButtons = page.locator(`[data-testid="${TestID.DeletePasskey}"]`)
      await trashButtons.first().dispatchEvent('click')
      await page.getByText('Remove').click()

      await expect(page.getByText('Make sure you have a backup')).toBeVisible()
      await page.getByRole('button', { name: /continue/i }).click()

      await page.getByTestId(TestID.DeletePasskeyAcknowledge).click()
      const deleteResponsePromise = page.waitForResponse((resp) => resp.url().includes('DeleteAuthenticator'))
      await page.getByRole('button', { name: /^delete$/i }).click()
      await deleteResponsePromise

      // Inverse of the old last-passkey test: deleting one of two passkeys must
      // leave the user signed in (no Disconnect side effect on non-last delete).
      await expect(page.getByTestId(TestID.Web3StatusConnected)).toBeVisible()
    })
  },
)
