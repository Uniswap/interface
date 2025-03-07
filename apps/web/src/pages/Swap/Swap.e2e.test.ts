import { expect, test } from 'playwright/fixtures'
import { parseEther } from 'viem'

test('should load balances', async ({ page, anvil }) => {
  await page.goto('/swap')
  const ethBalance = await anvil.getBalance({
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  })
  expect(ethBalance).toBe(parseEther('10000'))
  await expect(page.getByText('10,000.00 ETH')).toBeVisible()
})
