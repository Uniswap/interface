import { getHasBackupLogin } from '~/features/wallet/components/AccountDrawer/PasskeyMenu/hooks/useEmbeddedWalletBackupStatus'

const baseParams = {
  isQueryEnabled: true,
  isLoading: false,
  isError: false,
  authData: { recoveryMethods: [] as unknown[] },
  hasPrivyAppId: true,
}

describe(getHasBackupLogin, () => {
  it('is false when a valid response confirms no recovery method yet', () => {
    expect(getHasBackupLogin(baseParams)).toBe(false)
  })

  it('is true when the wallet already has a recovery method', () => {
    expect(getHasBackupLogin({ ...baseParams, authData: { recoveryMethods: [{ type: 'google' }] } })).toBe(true)
  })

  it.each([
    ['the query is skipped', { isQueryEnabled: false }],
    ['the response is unavailable', { authData: undefined }],
    ['the query is loading', { isLoading: true, authData: undefined }],
    ['the query errors', { isError: true, authData: undefined }],
    ['there is no Privy app id', { hasPrivyAppId: false }],
  ])('fails closed to undefined when %s', (_, overrides) => {
    expect(getHasBackupLogin({ ...baseParams, ...overrides })).toBeUndefined()
  })
})
