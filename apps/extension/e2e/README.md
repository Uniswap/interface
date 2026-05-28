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
- Automatically completes onboarding with test wallet
- Uses test seed phrase: `test test test test test test test test test test test junk`
- Use for testing wallet functionality

## Programmatic Onboarding

Tests that require an onboarded extension will automatically complete the onboarding process using a test seed phrase. This approach:
- Avoids committing sensitive user data
- Ensures consistent test environment
- Works identically in CI and local development
- No manual setup required

## CI Integration

Tests run automatically on PRs that affect the extension or its dependencies using GitHub Actions.
