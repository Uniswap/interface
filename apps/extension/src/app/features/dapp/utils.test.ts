import {
  getActiveSignerConnectedAccount,
  getCapitalizedDisplayNameFromTab,
  getOrderedConnectedAddresses,
  isConnectedAccount,
} from 'src/app/features/dapp/utils'
import { SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2, SAMPLE_SEED_ADDRESS_3 } from 'uniswap/src/test/fixtures'
import { extractNameFromUrl } from 'utilities/src/format/extractNameFromUrl'
import { promiseTimeout } from 'utilities/src/time/timing'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { ACCOUNT, ACCOUNT2, ACCOUNT3, readOnlyAccount } from 'wallet/src/test/fixtures'

jest.mock('utilities/src/format/extractNameFromUrl', () => ({
  extractNameFromUrl: jest.fn(),
}))

jest.mock('utilities/src/time/timing', () => ({
  promiseTimeout: jest.fn(),
}))

const mockChromeTabsQuery = jest.fn()

global.chrome = {
  tabs: {
    ...global.chrome.tabs,
    query: mockChromeTabsQuery,
  },
} as unknown as typeof global.chrome

const mockFunctions = {
  extractNameFromUrl: extractNameFromUrl as jest.Mock,
  promiseTimeout: promiseTimeout as jest.Mock,
}

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
    const result = getActiveSignerConnectedAccount(accounts, SAMPLE_SEED_ADDRESS_2)
    expect(result).toEqual(ACCOUNT2)
  })

  it('throws an error if the address is not in the list', () => {
    expect(() => {
      getActiveSignerConnectedAccount(accounts, SAMPLE_SEED_ADDRESS_3)
    }).toThrow('The active connected address must be in the list of connected accounts.')
  })

  it('throws an error if the account is not a signer mnemonic account', () => {
    const readOnlyAccount1 = readOnlyAccount()
    const accounts: Account[] = [ACCOUNT, ACCOUNT2, readOnlyAccount1]
    expect(() => {
      getActiveSignerConnectedAccount(accounts, readOnlyAccount1.address!)
    }).toThrow('The active connected address must be a signer mnemonic account.')
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

describe('getCapitalizedDisplayNameFromTab', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return the capitalized display name when the title contains the dapp name', async () => {
    const dappUrl = 'https://example.com'
    const dappName = 'example'
    const tabTitle = 'Example - Dapp'

    mockFunctions.extractNameFromUrl.mockReturnValue(dappName)
    mockChromeTabsQuery.mockResolvedValue([{ title: tabTitle }])
    mockFunctions.promiseTimeout.mockResolvedValue([{ title: tabTitle }])

    const result = await getCapitalizedDisplayNameFromTab(dappUrl)

    expect(result).toBe('Example')
  })

  it('should return undefined when the title does not contain the dapp name', async () => {
    const dappUrl = 'https://example.com'
    const dappName = 'example'
    const tabTitle = 'Another Dapp'

    mockFunctions.extractNameFromUrl.mockReturnValue(dappName)
    mockChromeTabsQuery.mockResolvedValue([{ title: tabTitle }])
    mockFunctions.promiseTimeout.mockResolvedValue([{ title: tabTitle }])

    const result = await getCapitalizedDisplayNameFromTab(dappUrl)

    expect(result).toBeUndefined()
  })

  it('should return undefined when there is no active tab', async () => {
    const dappUrl = 'https://example.com'

    mockFunctions.extractNameFromUrl.mockReturnValue('example')
    mockChromeTabsQuery.mockResolvedValue([])
    mockFunctions.promiseTimeout.mockResolvedValue([])

    const result = await getCapitalizedDisplayNameFromTab(dappUrl)

    expect(result).toBeUndefined()
  })

  it('should return undefined when promiseTimeout times out', async () => {
    const dappUrl = 'https://example.com'

    mockFunctions.extractNameFromUrl.mockReturnValue('example')
    mockFunctions.promiseTimeout.mockResolvedValue(undefined)

    const result = await getCapitalizedDisplayNameFromTab(dappUrl)

    expect(result).toBeUndefined()
  })
})
