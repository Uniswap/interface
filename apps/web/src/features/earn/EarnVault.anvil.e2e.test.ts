import { Token as DataApiToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
/**
 * Focused Earn coverage against the backend vault config and a mainnet fork.
 *
 * Vault addresses deliberately do not live in this suite. ListEarnVaults supplies
 * the three backend-allowlisted vaults, and the position shim echoes the address
 * selected by the UI. A backend vault rotation therefore requires no frontend edit.
 *
 * The stateful plan lifecycle is mocked because hosted services cannot observe Anvil-only
 * transaction hashes. Quote and plan calldata still target the live backend-configured vaults.
 */
import { DataApiService } from '@uniswap/client-data-api/dist/data/v2/api_connect'
import { GetEarnPositionResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import {
  EarnPosition,
  EarnPositionStatus,
  EarnVault,
  EarnVaultStatus,
} from '@uniswap/client-data-api/dist/data/v2/earn_pb'
import { WETH_ADDRESS } from '@uniswap/universal-router-sdk'
import { FeatureFlags } from '@universe/gating'
import { USDC, USDT } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { parseEther, parseUnits } from 'viem'
import { installEarnPlanMock, installEarnQuoteMock } from '~/playwright/anvil/earn'
import { ONE_MILLION_USDT } from '~/playwright/anvil/utils'
import { expect, getTest, type Page } from '~/playwright/fixtures'
import type { AnvilClient } from '~/playwright/fixtures/anvil'
import { createTestUrlBuilder } from '~/playwright/fixtures/urls'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'
import { assume0xAddress } from '~/utils/wagmi'

const test = getTest({ withAnvil: true })
const buildEarnExploreUrl = createTestUrlBuilder({
  basePath: '/explore',
  defaultFeatureFlags: {
    [FeatureFlags.Earn]: true,
    [FeatureFlags.ChainedActions]: true,
    [FeatureFlags.DisableSessionsForPlan]: true,
  },
})
const EARN_EXPLORE_URL = buildEarnExploreUrl({})
const SNAPSHOT_BLOCK_LAG = 2
const ONE_MILLION_6DP = ONE_MILLION_USDT

type EarnVaultFixture = {
  chipSymbol: 'ETH' | 'USDC' | 'USDT'
  underlying: { address: string; decimals: number; symbol: 'USDC' | 'USDT' | 'WETH' }
  positionAmount: string
}

const VAULTS: readonly EarnVaultFixture[] = [
  {
    chipSymbol: 'USDT',
    underlying: { address: USDT.address, decimals: 6, symbol: 'USDT' },
    positionAmount: '500',
  },
  {
    chipSymbol: 'USDC',
    underlying: { address: USDC.address, decimals: 6, symbol: 'USDC' },
    positionAmount: '500',
  },
  {
    chipSymbol: 'ETH',
    underlying: {
      address: WETH_ADDRESS(UniverseChainId.Mainnet),
      decimals: 18,
      symbol: 'WETH',
    },
    positionAmount: '0.5',
  },
] as const

function buildEarnVault({ vaultAddress, fixture }: { vaultAddress: string; fixture: EarnVaultFixture }): EarnVault {
  return new EarnVault({
    address: vaultAddress,
    chainId: UniverseChainId.Mainnet,
    name: `${fixture.underlying.symbol} Vault`,
    symbol: `m${fixture.underlying.symbol}`,
    status: EarnVaultStatus.ACTIVE,
    liquidityRaw: '1000000000000000000000000',
    liquidityUsd: 1_000_000,
    netApy: 0.05,
    underlyingToken: new DataApiToken({
      chainId: UniverseChainId.Mainnet,
      address: fixture.underlying.address,
      symbol: fixture.underlying.symbol,
      decimals: fixture.underlying.decimals,
      name: fixture.underlying.symbol,
    }),
  })
}

async function installForkPositionShim(page: Page, fixture: EarnVaultFixture): Promise<void> {
  const methodPath = `${DataApiService.typeName}/${DataApiService.methods.getEarnPosition.name}`
  await page.route(`**/${methodPath}`, async (route) => {
    const request = JSON.parse(route.request().postData() ?? '{}') as { vaultAddress?: string }
    const vaultAddress = request.vaultAddress ?? ''
    const response = new GetEarnPositionResponse({
      position: new EarnPosition({
        vault: buildEarnVault({ vaultAddress, fixture }),
        currentAssetsRaw: parseUnits(fixture.positionAmount, fixture.underlying.decimals).toString(),
        sharesRaw: parseUnits(fixture.positionAmount, fixture.underlying.decimals).toString(),
        currentAssetsUsd: 500,
        status: EarnPositionStatus.ACTIVE,
      }),
    })
    await route.fulfill({ status: 200, contentType: 'application/json', body: response.toJsonString() })
  })
}

async function openVault(page: Page, symbol: EarnVaultFixture['chipSymbol']): Promise<void> {
  const chip = page.getByTestId(`${TestID.EarnVaultChipPrefix}${symbol}`)
  await expect(chip).toBeVisible({ timeout: 30_000 })
  await chip.click()
}

async function expectEarnActivityPopup({
  page,
  title,
  descriptor,
}: {
  page: Page
  title: 'Deposited' | 'Withdrew'
  descriptor: RegExp
}): Promise<void> {
  const popup = page.getByTestId(TestID.ActivityPopup).filter({ hasText: title }).first()
  await expect(popup).toBeVisible({ timeout: 90_000 })
  await expect(popup).toContainText(descriptor)
}

async function deposit(page: Page, symbol: EarnVaultFixture['chipSymbol']): Promise<void> {
  await openVault(page, symbol)
  const modal = page.getByRole('dialog')
  await modal.getByRole('button', { name: /^deposit$/i }).click()
  await modal.getByRole('textbox').first().fill('500')
  await modal.getByRole('button', { name: /review/i }).click()
  const submitButton = modal.getByRole('button', { name: /deposit/i })
  await expect(submitButton).toBeEnabled({ timeout: 90_000 })
  await submitButton.click()
  await expectEarnActivityPopup({ page, title: 'Deposited', descriptor: new RegExp(`${symbol} to Earn`, 'i') })
}

async function withdraw({
  page,
  anvil,
  symbol,
}: {
  page: Page
  anvil: AnvilClient
  symbol: EarnVaultFixture['chipSymbol']
}): Promise<void> {
  await anvil.mine({ blocks: SNAPSHOT_BLOCK_LAG + 1 })
  await page.goto(EARN_EXPLORE_URL)
  await openVault(page, symbol)
  const modal = page.getByRole('dialog')
  const withdrawButton = modal.getByRole('button', { name: /^withdraw$/i })
  await expect(withdrawButton).toBeEnabled({ timeout: 30_000 })
  await withdrawButton.click()

  if (symbol === 'ETH') {
    // WETH9.withdraw uses a 2,300-gas transfer. Clear the mock wallet's EIP-7702
    // delegation so the fork behaves like the plain EOA represented by this test.
    await anvil.request({ method: 'anvil_setCode', params: [TEST_WALLET_ADDRESS, '0x'] })
  }

  await modal.getByRole('textbox').first().fill('100')
  await modal.getByRole('button', { name: /review/i }).click()
  const submitButton = modal.getByRole('button', { name: /withdraw/i })
  await expect(submitButton).toBeEnabled({ timeout: 90_000 })
  await submitButton.click()
  await expectEarnActivityPopup({ page, title: 'Withdrew', descriptor: new RegExp(`${symbol} from Earn`, 'i') })
}

test.describe(
  'Earn vault deposit and withdraw',
  {
    tag: '@team:apps-swap',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-swap' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    for (const fixture of VAULTS) {
      test(`deposits and withdraws ${fixture.chipSymbol}`, async ({ page, anvil }) => {
        test.setTimeout(300_000)
        await installEarnQuoteMock(page, {
          isNativeDeposit: fixture.chipSymbol === 'ETH',
          underlyingAddress: assume0xAddress(fixture.underlying.address),
        })
        await installEarnPlanMock(page, {
          isNativeDeposit: fixture.chipSymbol === 'ETH',
        })
        await installForkPositionShim(page, fixture)

        if (fixture.chipSymbol === 'ETH') {
          const balanceBefore = await anvil.getBalance({ address: TEST_WALLET_ADDRESS })
          await page.goto(EARN_EXPLORE_URL)
          await deposit(page, fixture.chipSymbol)
          const balanceAfterDeposit = await anvil.getBalance({ address: TEST_WALLET_ADDRESS })
          expect(balanceBefore - balanceAfterDeposit).toBeGreaterThan(parseEther('0.05'))

          await withdraw({ page, anvil, symbol: fixture.chipSymbol })
          await expect
            .poll(() => anvil.getBalance({ address: TEST_WALLET_ADDRESS }), {
              timeout: 90_000,
              intervals: [2_000],
            })
            .toBeGreaterThan(balanceAfterDeposit)
          return
        }

        const token = assume0xAddress(fixture.underlying.address)
        await anvil.setErc20Balance({ address: token, balance: ONE_MILLION_6DP })
        const balanceBefore = await anvil.getErc20Balance(token, TEST_WALLET_ADDRESS)

        await page.goto(EARN_EXPLORE_URL)
        await deposit(page, fixture.chipSymbol)
        let balanceAfterDeposit = balanceBefore
        await expect
          .poll(
            async () => {
              balanceAfterDeposit = await anvil.getErc20Balance(token, TEST_WALLET_ADDRESS)
              return balanceAfterDeposit
            },
            {
              timeout: 90_000,
              intervals: [2_000],
            },
          )
          .toBeLessThan(balanceBefore)

        await withdraw({ page, anvil, symbol: fixture.chipSymbol })
        await expect
          .poll(() => anvil.getErc20Balance(token, TEST_WALLET_ADDRESS), {
            timeout: 90_000,
            intervals: [2_000],
          })
          .toBeGreaterThan(balanceAfterDeposit)
      })
    }

    test('positioned vault tablist stretches across the modal width', async ({ page }) => {
      test.setTimeout(120_000)
      const fixture = VAULTS[0]
      await installForkPositionShim(page, fixture)

      await page.goto(EARN_EXPLORE_URL)
      await openVault(page, fixture.chipSymbol)

      const modal = page.getByRole('dialog')
      const tablist = modal.getByRole('tablist')
      await expect(tablist).toBeVisible({ timeout: 30_000 })

      const modalBox = await modal.boundingBox()
      const tablistBox = await tablist.boundingBox()
      expect(modalBox).not.toBeNull()
      expect(tablistBox).not.toBeNull()
      // Regression guard: the Balance/Details control must fill the modal, not shrink to
      // intrinsic width inside the centered header. Broken ~39%, corrected ~90%.
      expect((tablistBox?.width ?? 0) / (modalBox?.width ?? 1)).toBeGreaterThan(0.8)
    })
  },
)
