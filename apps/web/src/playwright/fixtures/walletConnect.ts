/* oxlint-disable react-hooks/rules-of-hooks -- Playwright fixtures use `use()` which is not a React hook */
// oxlint-disable eslint-js/no-restricted-syntax -- Node-side Playwright code: process.env is the config surface here
// oxlint-disable-next-line no-restricted-imports -- WC e2e fixture needs direct Playwright imports
import { test as base, type Page } from '@playwright/test'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { getAnvilManager } from '~/playwright/anvil/anvil-manager'
import { type LocalRelay, startLocalRelay } from '~/playwright/wc/localRelay'
import { createWalletCounterparty, type WalletCounterparty } from '~/playwright/wc/walletCounterparty'

// Must match WC_RELAY_URL_OVERRIDE in .env.e2e.override (baked into the interface bundle).
const DEFAULT_RELAY_URL = 'ws://127.0.0.1:5555'

function resolveRelayUrl(): string {
  return process.env.WC_RELAY_URL_OVERRIDE?.trim() || DEFAULT_RELAY_URL
}

function resolveRelayPort(url: string): number {
  const port = Number(new URL(url).port)
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid WalletConnect relay url (no port): ${url}`)
  }
  return port
}

function resolveProjectId(): string {
  const projectId = process.env.WALLETCONNECT_PROJECT_ID ?? process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID
  if (!projectId) {
    throw new Error('WALLETCONNECT_PROJECT_ID is required for the WalletConnect e2e counterparty')
  }
  return projectId
}

export interface WalletConnectFixture {
  /**
   * Establishes the WalletConnect session: reads the interface's display_uri (surfaced by the
   * `?wcConnect=true` auto-connect branch), pairs the counterparty, approves the session, and
   * waits for the interface to show the connected wallet. Navigate with `?wcConnect=true` first.
   */
  connect: (page: Page) => Promise<void>
  counterparty: WalletCounterparty
}

export const test = base.extend<{ walletConnect: WalletConnectFixture }, { wcRelay: LocalRelay }>({
  // One relay per worker (e2e runs serially); the fixed port matches the interface bundle.
  wcRelay: [
    // oxlint-disable-next-line no-empty-pattern -- worker fixture takes no deps
    async ({}, use) => {
      const relayUrl = resolveRelayUrl()
      const relay = await startLocalRelay({ port: resolveRelayPort(relayUrl) })
      await use(relay)
      await relay.close()
    },
    { scope: 'worker' },
  ],

  async walletConnect({ wcRelay }, use) {
    const counterparty = await createWalletCounterparty({
      relayUrl: wcRelay.url,
      projectId: resolveProjectId(),
      anvilRpcUrl: getAnvilManager().getUrl(),
    })

    const fixture: WalletConnectFixture = {
      counterparty,
      async connect(page) {
        const uriHandle = await page.waitForFunction(
          () => (window as unknown as { __WC_DISPLAY_URI__?: string }).__WC_DISPLAY_URI__,
          undefined,
          { timeout: 30_000 },
        )
        const uri = (await uriHandle.jsonValue()) as string
        await counterparty.pairAndApprove(uri)
        // Wait for wagmi to report the connected account in the UI.
        await page.getByTestId(TestID.Web3StatusConnected).waitFor({ state: 'visible', timeout: 30_000 })
      },
    }

    await use(fixture)
    await counterparty.close()
  },
})
