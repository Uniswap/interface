import {
  getActiveConnectedAccount,
  getOrderedConnectedAddresses,
  isConnectedAccount,
} from 'src/app/features/dapp/utils'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import {
  ACCOUNT,
  ACCOUNT2,
  ACCOUNT3,
  SAMPLE_SEED_ADDRESS_1,
  SAMPLE_SEED_ADDRESS_2,
  SAMPLE_SEED_ADDRESS_3,
} from 'wallet/src/test/fixtures'

describe('isConnectedAccount', () => {
  it('returns true if the account is connected', () => {
    const accounts: Account[] = [ACCOUNT, ACCOUNT2]
    expect(isConnectedAccount(accounts, SAMPLE_SEED_ADDRESS_1)).toBe(true)
  })

  it('returns false if the account is not connected', () => {
    const accounts: Account[] = [ACCOUNT]
    expect(isConnectedAccount(accounts, SAMPLE_SEED_ADDRESS_2)).toBe(false)
  })
})

describe('getActiveConnectedAccount', () => {
  const accounts: Account[] = [ACCOUNT, ACCOUNT2]

  it('returns the account for the given address', () => {
    const result = getActiveConnectedAccount(accounts, SAMPLE_SEED_ADDRESS_2)
    expect(result).toEqual(ACCOUNT2)
  })

  it('throws an error if the address is not in the list', () => {
    expect(() => {
      getActiveConnectedAccount(accounts, SAMPLE_SEED_ADDRESS_3)
    }).toThrow('The activeConnectedAddress must be in the list of connectedAccounts.')
  })
})

describe('getOrderedConnectedAddresses', () => {
  const accounts: Account[] = [ACCOUNT, ACCOUNT2, ACCOUNT3]

  it('places the active address first', () => {
    const activeAddress = SAMPLE_SEED_ADDRESS_2
    const expectedOrder = [SAMPLE_SEED_ADDRESS_2, SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_3]
    const result = getOrderedConnectedAddresses(accounts, activeAddress)
    expect(result).toEqual(expectedOrder)
  })

  it('returns the same order if the active address is already first', () => {
    const activeAddress = SAMPLE_SEED_ADDRESS_1
    const expectedOrder = [SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2, SAMPLE_SEED_ADDRESS_3]
    const result = getOrderedConnectedAddresses(accounts, activeAddress)
    expect(result).toEqual(expectedOrder)
  })

  it('handles cases where the active address is not in the list', () => {
    const activeAddress = '0xabc' // Not in the accounts list
    const expectedOrder = [SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2, SAMPLE_SEED_ADDRESS_3] // Original order since active address is not found
    const result = getOrderedConnectedAddresses(accounts, activeAddress)
    expect(result).toEqual(expectedOrder)
  })
})
