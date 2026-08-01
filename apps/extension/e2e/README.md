# Extension E2E Tests

End-to-end tests for the Uniswap Chrome Extension using Playwright.

## Setup

1. Install dependencies (from repo root):
   ```bash
   bun install
   ```

2. Install Playwright browsers (from extension directory):
   ```bash
   cd apps/extension
   bun playwright install chromium
   ```

## Running Tests

### Build and run all tests:
```bash
bun run e2e
```

### Build and run smoke tests only:
```bash
bun run e2e:smoke
```

### Run tests without rebuilding:
```bash
bun run playwright:test
```

### Run the publish-gate subset (blocks Chrome Web Store uploads):
```bash
bun run playwright:test:publish-gate
```

Tests tagged `@publish-gate` are the golden-path subset the extension publish workflows
run against the exact built artifact (with its real config) between build and Chrome Web
Store upload — a failure blocks the upload. Keep this subset small, high-signal, and
low-flake. Set `EXTENSION_BUILD_DIR` to point the suite at a different build.

### Run tests in UI mode (for debugging):
```bash
bun playwright test --ui --config=e2e/config/playwright.config.ts
```

### Run tests in headless environment (CI/SSH):
Chrome extensions require a display server. If you're running in a headless environment, use xvfb:
```bash
# Install xvfb if needed
sudo apt-get install xvfb
# Run tests with xvfb
xvfb-run -a bun run e2e:smoke
```


## Test Structure

- `config/` - Playwright configuration
- `fixtures/` - Test fixtures for extension loading
- `tests/smoke/` - Smoke tests for critical functionality
  - `basic-setup.test.ts` - Verifies extension loads correctly
  - `onboarding-flow.test.ts` - Tests fresh install onboarding
  - `onboarding-import.test.ts` - Tests onboarding via seed phrase import (deterministic wallet)
  - `sidebar-loads.test.ts` - Tests sidebar functionality (auto-onboards)
  - `wallet-connection.test.ts` - Tests dApp connection flow (auto-onboards)
- `utils/` - Helper utilities including programmatic onboarding

## Test Fixtures

### freshExtensionTest
- Loads extension with no user data
- Triggers onboarding flow
- Use for testing fresh installation scenarios

### onboardedExtensionTest
- Loads extension with fresh user data
- Automatically completes onboarding via the "create new wallet" flow
- The wallet is randomly generated, so the address differs on every run
- Use for testing wallet functionality that doesn't depend on a specific address

### importedExtensionTest
- Loads extension with fresh user data
- Automatically completes onboarding by importing the canonical public Hardhat/Anvil dev
  mnemonic: `test test test test test test test test test test test junk`
- Produces the same deterministic wallet on every run
  (`TEST_WALLET_ADDRESS = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)
- Use for tests that assert on addresses, balances, or any address-derived state

## Programmatic Onboarding

Tests that require an onboarded extension automatically complete the onboarding process
through the real onboarding UI. `importedExtensionTest` imports the public Hardhat/Anvil
dev seed phrase — it is intentionally public, must never hold real funds, and no other
seed phrase may ever be added to this suite. This approach:
- Avoids committing sensitive user data (the only seed phrase used is the public dev one)
- Ensures consistent test environment
- Works identically in CI and local development
- No manual setup required

## CI Integration

Tests run automatically on PRs that affect the extension or its dependencies using GitHub Actions.
