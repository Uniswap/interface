/**
 * Common mocks for @universe/environment. Imported by jest-setup.js of
 * consuming packages.
 *
 * Mocks the env module so the throwing platform-split stubs in
 * src/environment/env.ts don't blow up at module load (constants.ts
 * calls isRNDev/isDevEnv eagerly).
 */

jest.mock('@universe/environment/src/environment/env', () => ({
  BUNDLE_ID: 'com.uniswap.mobile.dev',
  isTestEnv: jest.fn(() => true),
  isDevEnv: jest.fn(() => false),
  isBetaEnv: jest.fn(() => false),
  isProdEnv: jest.fn(() => false),
  isRNDev: jest.fn(() => true),
  isUnitTestEnv: jest.fn(() => true),
  isE2eTestEnv: jest.fn(() => false),
  localDevDatadogEnabled: false,
  isDatadogEnabled: jest.fn(() => false),
}))
