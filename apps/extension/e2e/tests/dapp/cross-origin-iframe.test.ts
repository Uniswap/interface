import { type BrowserContext, expect, type Frame, type Page } from '@playwright/test'
import { TestID } from '@universe/test'
import { onboardedExtensionTest as test } from 'e2e/fixtures/extension.fixture'
import { approveConnectionInSidebarIfPrompted } from 'e2e/utils/dapp-connection-helpers'
import { openExtensionSidebar, waitForBackgroundReady } from 'e2e/utils/extension-helpers'
import { unlockIfLocked } from 'e2e/utils/unlock-helpers'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

// Served via context.route. Content scripts only inject into https pages, and `.test` is a
// reserved TLD, so these can never reach a real host.
const PARENT_ORIGIN = 'https://parent-dapp.fixture.test'
const FRAME_ORIGIN = 'https://embedded-frame.fixture.test'
const SAME_ORIGIN_EMBED_URL = `${PARENT_ORIGIN}/embed`

const USER_REJECTED_CODE = 4001
const UNAUTHORIZED_CODE = 4100

interface ProviderResult {
  result?: unknown
  error?: { code?: number; message?: string }
}

interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>
}

function pageHtml(title: string, body = ''): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body><h1>${title}</h1>${body}</body></html>`
}

const PARENT_HTML = pageHtml(
  'Parent dapp',
  `<iframe id="cross-origin" src="${FRAME_ORIGIN}/"></iframe><iframe id="same-origin" src="${SAME_ORIGIN_EMBED_URL}"></iframe>`,
)

async function serveFixtureOrigins(context: BrowserContext): Promise<void> {
  await context.route(/^https:\/\/[a-z-]+\.fixture\.test\//, async (route) => {
    const url = route.request().url()
    const body = url === `${PARENT_ORIGIN}/` ? PARENT_HTML : pageHtml(new URL(url).origin)
    await route.fulfill({ contentType: 'text/html', body })
  })
}

async function waitForProvider(target: Page | Frame): Promise<void> {
  await expect
    .poll(() => target.evaluate(() => typeof (window as { ethereum?: unknown }).ethereum !== 'undefined'), {
      timeout: ONE_SECOND_MS * 15,
    })
    .toBe(true)
}

function request(target: Page | Frame, method: string, params?: unknown[]): Promise<ProviderResult> {
  return target.evaluate(
    async (args) => {
      const provider = (window as { ethereum?: Eip1193Provider }).ethereum
      try {
        return { result: await provider?.request(args) }
      } catch (error) {
        const { code, message } = error as { code?: number; message?: string }
        return { error: { code, message } }
      }
    },
    { method, params },
  )
}

/** eth_requestAccounts returns checksummed addresses while eth_accounts returns lowercase. */
function accountsOf({ result }: ProviderResult): string[] {
  return (result as string[]).map((address) => address.toLowerCase())
}

/** Resolves once either the request settles or an approval prompt renders in the sidebar. */
async function requestOrPrompt(sidebarPage: Page, pending: Promise<ProviderResult>): Promise<'settled' | 'prompted'> {
  return Promise.race([
    pending.then(() => 'settled' as const),
    sidebarPage
      .getByTestId(TestID.Confirm)
      .waitFor({ state: 'visible', timeout: ONE_SECOND_MS * 20 })
      .then(() => 'prompted' as const),
  ])
}

test.describe('Cross-origin iframe dapp authorization', () => {
  // Bug bounty #643: an iframe from another origin inherited the parent page's connection.
  test('an iframe on a connected dapp needs its own approval and cannot disconnect the parent', async ({
    context,
    extensionId,
  }) => {
    test.setTimeout(ONE_SECOND_MS * 150)
    await waitForBackgroundReady(context)
    await serveFixtureOrigins(context)

    // Approval prompts only render in an open side panel instance.
    const sidebarPage = await openExtensionSidebar(context, extensionId)
    await sidebarPage.waitForLoadState('domcontentloaded')
    await unlockIfLocked(sidebarPage)

    const parentPage = await context.newPage()
    await parentPage.goto(`${PARENT_ORIGIN}/`)
    const crossOriginFrame = parentPage.frame({ url: `${FRAME_ORIGIN}/` })
    const sameOriginFrame = parentPage.frame({ url: SAME_ORIGIN_EMBED_URL })
    if (!crossOriginFrame || !sameOriginFrame) {
      throw new Error('Fixture iframes did not load')
    }
    await Promise.all([parentPage, crossOriginFrame, sameOriginFrame].map(waitForProvider))

    const parentConnect = request(parentPage, 'eth_requestAccounts')
    await approveConnectionInSidebarIfPrompted(sidebarPage, parentConnect)
    const parentAccounts = accountsOf(await parentConnect)
    expect(parentAccounts).toHaveLength(1)

    await test.step('cross-origin iframe does not inherit the connection', async () => {
      expect((await request(crossOriginFrame, 'eth_accounts')).error?.code).toBe(UNAUTHORIZED_CODE)
    })

    await test.step('cross-origin iframe gets its own prompt, labeled with the parent, and can be rejected', async () => {
      const frameConnect = request(crossOriginFrame, 'eth_requestAccounts')
      expect(await requestOrPrompt(sidebarPage, frameConnect)).toBe('prompted')
      await expect(sidebarPage.getByText('embedded-frame.fixture.test via parent-dapp.fixture.test')).toBeVisible()

      await sidebarPage.getByTestId(TestID.Cancel).click()
      expect((await frameConnect).error?.code).toBe(USER_REJECTED_CODE)
      expect((await request(crossOriginFrame, 'eth_accounts')).error?.code).toBe(UNAUTHORIZED_CODE)
      expect(accountsOf(await request(parentPage, 'eth_accounts'))).toEqual(parentAccounts)
    })

    await test.step('cross-origin iframe revoking its own connection leaves the parent connected', async () => {
      const frameConnect = request(crossOriginFrame, 'eth_requestAccounts')
      expect(await requestOrPrompt(sidebarPage, frameConnect)).toBe('prompted')
      await sidebarPage.getByTestId(TestID.Confirm).click()
      expect(accountsOf(await frameConnect)).toEqual(parentAccounts)

      expect(
        (await request(crossOriginFrame, 'wallet_revokePermissions', [{ eth_accounts: {} }])).error,
      ).toBeUndefined()
      expect(accountsOf(await request(parentPage, 'eth_accounts'))).toEqual(parentAccounts)
    })

    await test.step('same-origin iframe shares the connection without a prompt', async () => {
      await expect.poll(async () => accountsOf(await request(sameOriginFrame, 'eth_accounts'))).toEqual(parentAccounts)

      const embedConnect = request(sameOriginFrame, 'eth_requestAccounts')
      expect(await requestOrPrompt(sidebarPage, embedConnect)).toBe('settled')
      expect(accountsOf(await embedConnect)).toEqual(parentAccounts)
    })
  })
})
