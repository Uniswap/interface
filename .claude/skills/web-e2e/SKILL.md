---
name: web-e2e
description: Run, create, and debug Playwright e2e tests for the web app. ALWAYS invoke this skill using the SlashCommand tool (i.e., `/web-e2e`) BEFORE attempting to run any e2e tests, playwright tests, anvil tests, or debug test failures. DO NOT run `bun playwright test` or other e2e commands directly - you must invoke this skill first to learn the correct commands and test architecture.
allowed-tools: [Read, Write, Edit, Bash, Glob, Grep, mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_console_messages, mcp__playwright__browser_network_requests, mcp__playwright__browser_evaluate]
---

# Web E2E Testing Skill

This skill helps you create and run end-to-end (e2e) Playwright tests for the Uniswap web application.

## Test Architecture

### Test Location
- All e2e tests live in `apps/web/src/` directory structure
- Test files use the naming convention: `*.e2e.test.ts`
- Anvil-specific tests (requiring local blockchain): `*.anvil.e2e.test.ts`

### Automatic Wallet Connection

**Important**: When running Playwright tests, the app automatically connects to a test wallet:
- **Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (constant: `TEST_WALLET_ADDRESS`)
- **Display name**: `test0` (the Unitag associated with this address)
- **Connection**: Happens automatically via `wagmiAutoConnect.ts` when in Playwright environment

This means:
- Tests start with a wallet already connected
- You can immediately test wallet-dependent features
- The wallet button will show "test0" instead of "Connect wallet"

**When using Playwright MCP**: To enable automatic wallet connection when browsing via MCP tools, set the environment variable `REACT_APP_IS_PLAYWRIGHT_ENV=true` before starting the dev server. This makes the app behave identically to how it does in automated tests, with the test wallet auto-connected.

### Custom Fixtures

The web app uses custom Playwright fixtures and mocks that extend base Playwright functionality.
They are located in `apps/web/src/playwright/fixtures/*` and `apps/web/src/playwright/mocks/*`.

#### Import Pattern
```typescript
import { expect, getTest } from 'playwright/fixtures'

// For regular tests (no blockchain)
const test = getTest()

// For anvil tests (with blockchain)
const test = getTest({ withAnvil: true })
```

#### Available Fixtures

1. **graphql** - Mock GraphQL responses
   ```typescript
   await graphql.intercept('OperationName', Mocks.Path.to_mock)
   await graphql.waitForResponse('OperationName')
   ```

2. **anvil** - Local blockchain client (only in anvil tests)
   ```typescript
   // Set token balances
   await anvil.setErc20Balance({ address, balance })

   // Check balances
   await anvil.getBalance({ address })
   await anvil.getErc20Balance(tokenAddress, ownerAddress)

   // Manage allowances
   await anvil.setErc20Allowance({ address, spender, amount })
   await anvil.setPermit2Allowance({ token, spender, amount })

   // Mining blocks
   await anvil.mine({ blocks: 1 })

   // Snapshots for isolation
   const snapshotId = await anvil.takeSnapshot()
   await anvil.revertToSnapshot(snapshotId)
   ```

3. **tradingApi** - Mock Trading API responses
   ```typescript
   await stubTradingApiEndpoint({
     page,
     endpoint: uniswapUrls.tradingApiPaths.swap
   })
   ```

4. **amplitude** - Analytics mocking (automatic)

### Test Structure

```typescript
import { expect, getTest } from 'playwright/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const test = getTest({ withAnvil: true }) // or getTest() for non-anvil

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
  })

  test('should do something', async ({ page, anvil, graphql }) => {
    // Setup mocks
    await graphql.intercept('Operation', Mocks.Path.mock)

    // Setup blockchain state (if anvil test)
    await anvil.setErc20Balance({ address, balance })

    // Navigate to page
    await page.goto('/path')

    // Interact with UI using TestIDs
    await page.getByTestId(TestID.SomeButton).click()

    // Make assertions
    await expect(page.getByText('Expected Text')).toBeVisible()
  })
})
```

### Best Practices

1. **Use TestIDs** - Always use the TestID enum for selectors (not string literals)
   ```typescript
   // Good
   await page.getByTestId(TestID.ReviewSwap)

   // Bad
   await page.getByTestId('review-swap')
   ```

2. **Mock External Services** - Use fixtures to mock GraphQL, Trading API, REST API etc.
   ```typescript
   await graphql.intercept('PortfolioBalances', Mocks.PortfolioBalances.test_wallet)
   await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.quote })
   ```

3. **Use Mocks Helper** - Import mock paths from `playwright/mocks/mocks.ts`
   ```typescript
   import { Mocks } from 'playwright/mocks/mocks'
   await graphql.intercept('Token', Mocks.Token.uni_token)
   ```

4. **Test Constants** - Use constants from the codebase
   ```typescript
   import { USDT, DAI } from 'uniswap/src/constants/tokens'
   import { TEST_WALLET_ADDRESS } from 'playwright/fixtures/wallets'

   // TEST_WALLET_ADDRESS is the automatically connected wallet
   // It displays as "test0" in the UI
   ```

5. **Anvil State Management** - Set up blockchain state properly
   ```typescript
   // Always set token balances before testing swaps
   await anvil.setErc20Balance({
     address: assume0xAddress(USDT.address),
     balance: 100_000_000n
   })
   ```

## Running Tests

The following commands must be run from the `apps/web/` folder.

**⚠️ PREREQUISITE**: Playwright tests require the Vite preview server to be running at `http://localhost:3000` BEFORE tests start. The `bun e2e` commands handle this automatically, but if running tests directly you must start the server first.

### Development Commands

The `e2e` commands handle all requisite setup tasks for the playwright tests. These include building the app for production and running the Vite preview server.

```bash
# Run all e2e tests (starts anvil, builds, and runs tests)
bun e2e

# Run only non-anvil tests (faster, no blockchain required)
bun e2e:no-anvil

# Run only anvil tests (blockchain tests only)
bun e2e:anvil

# Run specific test file
bun e2e TokenSelector.e2e.test
```

### Direct Playwright Commands

In some cases it may be helpful to run the commands more directly with the different tasks in different terminals.

```bash
# Step 1: Build the web app for e2e
bun build:e2e

# Step 2: Start the Vite preview server (REQUIRED - must be running before tests)
bun preview:e2e
# Wait for "Local: http://localhost:3000" message

# (Optional) Step 3: Start Anvil (note, Anvil tests can start this themselves)
bun anvil:mainnet
# Wait for "Listening on 127.0.0.1:8545" message

# Step 4: Run the playwright tests (only after servers are ready)
bun playwright:test
```

### Test Modes

```bash
# Headed mode (see browser)
bun playwright test --headed

# Debug mode with Playwright Inspector
bun playwright test --debug

# UI mode (interactive)
bun playwright test --ui
```

## Configuration

### Playwright Config (`playwright.config.ts`)

Key settings:
- `testDir`: `./src`
- `testMatch`: `**/*.e2e.test.ts`
- `workers`: 1 (configured in CI)
- `fullyParallel`: false
- `baseURL`: `http://localhost:3000`

## Common Patterns

### Navigation and URL Testing
```typescript
await page.goto('/swap?inputCurrency=ETH&outputCurrency=USDT')
await expect(page.getByTestId(TestID.ChooseInputToken + '-label')).toHaveText('ETH')
```

### Form Interactions
```typescript
await page.getByTestId(TestID.AmountInputIn).fill('0.01')
await page.getByTestId(TestID.AmountInputIn).clear()
```

### Token Selection
```typescript
await page.getByTestId(TestID.ChooseOutputToken).click()
await page.getByTestId('token-option-1-USDT').first().click()
```

### Waiting for Transaction Completion
```typescript
await page.getByTestId(TestID.Swap).click()
await expect(page.getByText('Swapped')).toBeVisible()
```

### Blockchain Verification
```typescript
const balance = await anvil.getBalance({ address: TEST_WALLET_ADDRESS })
await expect(balance).toBeLessThan(parseEther('10000'))
```

## Troubleshooting

### Tests Timeout
- Check if Anvil is running: `bun anvil:mainnet`
- Ensure preview server is running: `bun preview:e2e`

### Anvil Issues
- Tests automatically manage Anvil snapshots for isolation
- Anvil restarts automatically if unhealthy
- For manual restart: stop the e2e command and run again

### Mock Not Working
- Ensure mock path is correct in `Mocks` object
- Check GraphQL operation name matches exactly
- Verify timing - intercept before the request is made

### Test Flakiness
- Use proper waiting: `await expect(element).toBeVisible()`
- Don't use fixed `setTimeout` - use Playwright's auto-waiting
- Check for race conditions with network requests

### Debugging

- Run tests with `--headed` flag to watch the browser
- Use `--debug` flag to step through with Playwright Inspector
- Add `await page.pause()` in your test to stop at a specific point
- Check test output and error messages carefully
- Review screenshots/videos in `test-results/` directory after failures

## Playwright Documentation References

For more details on Playwright features, refer to:

- **[Writing Tests](https://playwright.dev/docs/writing-tests)** - Test structure, actions, assertions
- **[Test Fixtures](https://playwright.dev/docs/test-fixtures)** - Creating custom fixtures (like our anvil/graphql fixtures)
- **[Running Tests](https://playwright.dev/docs/running-tests)** - Command line options, filtering, debugging
- **[API Testing](https://playwright.dev/docs/api-testing)** - Mocking and intercepting network requests
- **[Locators](https://playwright.dev/docs/locators)** - Finding elements (we use `getByTestId` primarily)
- **[Assertions](https://playwright.dev/docs/test-assertions)** - Available expect matchers
- **[Test Hooks](https://playwright.dev/docs/api/class-test#test-before-each)** - beforeEach, afterEach, beforeAll, afterAll
- **[Test Configuration](https://playwright.dev/docs/test-configuration)** - playwright.config.ts options
- **[Debugging Tests](https://playwright.dev/docs/debug)** - UI mode, inspector, trace viewer

## Playwright MCP Integration (Optional but Recommended)

The Playwright MCP (Model Context Protocol) provides browser automation capabilities that make test development and debugging easier:
- **Interactive debugging** - Navigate the app in a real browser to understand behavior
- **Creating tests** - Explore the UI to identify selectors and interactions
- **Debugging failures** - Inspect page state when tests fail

### Installing Playwright MCP

If you don't have the Playwright MCP installed, you can add it to your Claude Code configuration:

1. Open Claude Code settings (Command/Ctrl + Shift + P → "Claude Code: Open Settings")
2. Add the Playwright MCP to your `mcpServers` configuration:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
  }
}
```

3. Restart Claude Code

Alternatively, follow the installation guide at: https://github.com/executeautomation/playwright-mcp

### Using Playwright MCP for Test Development (Optional)

**If you have the MCP installed**, you can use these tools during development:

1. **Navigate and explore** - Use `mcp__playwright__browser_navigate` to visit pages
2. **Take snapshots** - Use `mcp__playwright__browser_snapshot` to see the page structure and find TestIDs
3. **Interact with elements** - Use `mcp__playwright__browser_click` and `mcp__playwright__browser_type` to test interactions
4. **Inspect state** - Use `mcp__playwright__browser_console_messages` and `mcp__playwright__browser_network_requests` to debug
5. **Take screenshots** - Use `mcp__playwright__browser_take_screenshot` to visualize issues

## When to Use This Skill

Use this skill when you need to:
- Create new end-to-end tests for web features
- Debug or fix failing e2e tests
- Run e2e tests during development
- Understand the e2e testing architecture
- Set up test fixtures or mocks
- Work with Anvil blockchain state in tests
