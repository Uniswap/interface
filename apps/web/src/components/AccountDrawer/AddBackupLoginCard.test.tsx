import { getShowAddBackupLoginCard } from '~/components/AccountDrawer/AddBackupLoginCard'

const baseParams = {
  isEmbeddedWallet: true,
  isPortfolioZero: false,
  isLoading: false,
  isError: false,
  authData: { recoveryMethods: [] as unknown[] },
  hasPrivyAppId: true,
}

describe('getShowAddBackupLoginCard', () => {
  it('shows when a valid response confirms no recovery method yet', () => {
    expect(getShowAddBackupLoginCard(baseParams)).toBe(true)
  })

  it('hides when the wallet already has a recovery method', () => {
    expect(getShowAddBackupLoginCard({ ...baseParams, authData: { recoveryMethods: [{ type: 'google' }] } })).toBe(
      false,
    )
  })

  it('fails closed: hides when the listAuthenticators response is unavailable (e.g. skipped query after switching wallets)', () => {
    expect(getShowAddBackupLoginCard({ ...baseParams, authData: undefined })).toBe(false)
  })

  it('hides while listAuthenticators is loading', () => {
    expect(getShowAddBackupLoginCard({ ...baseParams, isLoading: true, authData: undefined })).toBe(false)
  })

  it('hides when listAuthenticators errors', () => {
    expect(getShowAddBackupLoginCard({ ...baseParams, isError: true, authData: undefined })).toBe(false)
  })

  it('hides for non-embedded wallets', () => {
    expect(getShowAddBackupLoginCard({ ...baseParams, isEmbeddedWallet: false })).toBe(false)
  })
})
