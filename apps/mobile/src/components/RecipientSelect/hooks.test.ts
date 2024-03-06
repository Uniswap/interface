import { PreloadedState } from '@reduxjs/toolkit'
import { waitFor } from '@testing-library/react-native'
import { toIncludeSameMembers } from 'jest-extended'
import { act } from 'react-test-renderer'
import { MobileState } from 'src/app/reducer'
import { renderHookWithProviders } from 'src/test/render'
import { useRecipients } from 'wallet/src/components/RecipientSearch/hooks'
import { ChainId } from 'wallet/src/constants/chains'
import { SearchableRecipient } from 'wallet/src/features/address/types'
import { TransactionStateMap } from 'wallet/src/features/transactions/slice'
import { TransactionStatus } from 'wallet/src/features/transactions/types'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import {
  SAMPLE_SEED_ADDRESS_1,
  SAMPLE_SEED_ADDRESS_2,
  sendTokenTransactionInfo,
  signerMnemonicAccount,
  transactionDetails,
} from 'wallet/src/test/fixtures'

expect.extend({ toIncludeSameMembers })

const sendTxDetailsPending = transactionDetails({
  status: TransactionStatus.Pending,
  typeInfo: sendTokenTransactionInfo(),
  addedTime: 1487076708000,
})
const sendTxDetailsConfirmed = transactionDetails({
  status: TransactionStatus.Success,
  typeInfo: sendTokenTransactionInfo(),
  addedTime: 1487076708000,
})
const sendTxDetailsFailed = transactionDetails({
  status: TransactionStatus.Failed,
  typeInfo: sendTokenTransactionInfo(),
  addedTime: 1487076710000,
})

/**
 * Tests interaction of mobile state with useRecipients hook
 */

type PreloadedStateProps = {
  watchedAddresses?: Address[]
  hasInactiveAccounts?: boolean
  transactions?: TransactionStateMap
}

const getPreloadedState = (props?: PreloadedStateProps): PreloadedState<MobileState> => {
  const { watchedAddresses = [], hasInactiveAccounts = false, transactions = {} } = props || {}
  return {
    favorites: {
      watchedAddresses,
      tokens: [],
      tokensVisibility: {},
      nftsData: {},
    },
    wallet: {
      accounts: {
        [activeAccount.address]: activeAccount,
        ...(hasInactiveAccounts && { [inactiveAccount.address]: inactiveAccount }),
      },
      activeAccountAddress: activeAccount.address,
      isUnlocked: true,
      settings: {
        swapProtection: SwapProtectionSetting.On,
        hideSmallBalances: false,
        hideSpamTokens: false,
      },
    },
    transactions,
  }
}

const activeAccount = signerMnemonicAccount()
const inactiveAccount = signerMnemonicAccount()
const validatedAddressRecipient: SearchableRecipient = {
  address: SAMPLE_SEED_ADDRESS_1,
}

const watchedAddresses = [SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2]

const searchSectionResult = {
  title: 'Search results',
  data: [validatedAddressRecipient],
}

const recentRecipientsSectionResult = {
  title: 'Recent',
  data: [
    {
      address: sendTxDetailsFailed.typeInfo.recipient,
      name: '',
    },
    {
      address: sendTxDetailsConfirmed.typeInfo.recipient,
      name: '',
    },
    {
      address: sendTxDetailsPending.typeInfo.recipient,
      name: '',
    },
  ],
}

const recentRecipients = recentRecipientsSectionResult.data.map((recipient) => ({
  data: recipient,
  key: recipient.address,
}))

const inactiveWalletsSectionResult = {
  title: 'Your wallets',
  data: [inactiveAccount],
}

const favoriteWalletsSectionResult = {
  title: 'Favorite wallets',
  data: [{ address: SAMPLE_SEED_ADDRESS_1 }, { address: SAMPLE_SEED_ADDRESS_2 }],
}

describe(useRecipients, () => {
  it('returns correct initial values', () => {
    const { result } = renderHookWithProviders(useRecipients, {
      preloadedState: getPreloadedState(),
    })

    expect(result.current).toEqual({
      sections: [],
      searchableRecipientOptions: [],
      pattern: null,
      onChangePattern: expect.any(Function),
      loading: false,
    })
  })

  describe('Validated address recipient', () => {
    it('result does not contain Search Results section if there is no pattern', () => {
      const { result } = renderHookWithProviders(useRecipients, {
        preloadedState: getPreloadedState(),
      })

      expect(result.current).toEqual(
        expect.objectContaining({
          sections: expect.not.arrayContaining([
            expect.objectContaining({ title: 'Search results' }),
          ]),
        })
      )
    })

    it('result contains Search Results section if there is a pattern', async () => {
      const { result } = renderHookWithProviders(useRecipients, {
        preloadedState: getPreloadedState(),
      })

      // Set pattern
      await act(() => {
        result.current.onChangePattern(SAMPLE_SEED_ADDRESS_1)
      })

      await waitFor(() => {
        expect(result.current.sections).toEqual(expect.arrayContaining([searchSectionResult]))
      })
    })

    it('searchableRecipientOptions contains validatedAddressRecipient', async () => {
      const { result } = renderHookWithProviders(useRecipients, {
        preloadedState: getPreloadedState(),
      })

      // Set pattern
      await act(() => {
        result.current.onChangePattern(SAMPLE_SEED_ADDRESS_1)
      })

      expect(result.current.searchableRecipientOptions).toEqual(
        expect.arrayContaining([
          {
            data: expect.objectContaining({ address: SAMPLE_SEED_ADDRESS_1 }),
            key: SAMPLE_SEED_ADDRESS_1,
          },
        ])
      )
    })
  })

  describe('Recent recipients', () => {
    it('result does not contain Recent section if there are no recent recipients', () => {
      const { result } = renderHookWithProviders(useRecipients, {
        preloadedState: getPreloadedState(),
      })

      expect(result.current).toEqual(
        expect.objectContaining({
          sections: expect.not.arrayContaining([expect.objectContaining({ title: 'Recent' })]),
        })
      )
    })

    it('result contains Recent section if there are recent recipients', () => {
      const { result } = renderHookWithProviders(useRecipients, {
        preloadedState: getPreloadedState({
          transactions: {
            [activeAccount.address]: {
              [sendTxDetailsPending.chainId]: [sendTxDetailsPending],
            },
          },
        }),
      })

      expect(result.current).toEqual(
        expect.objectContaining({
          sections: expect.arrayContaining([
            {
              title: 'Recent',
              data: [
                {
                  address: sendTxDetailsPending.typeInfo.recipient,
                  name: '',
                },
              ],
            },
          ]),
        })
      )
    })

    it('returns unique recipient addresses', () => {
      const { result } = renderHookWithProviders(useRecipients, {
        preloadedState: getPreloadedState({
          transactions: {
            [activeAccount.address]: {
              [ChainId.Base as ChainId]: [sendTxDetailsPending, sendTxDetailsConfirmed],
              [ChainId.Mainnet as ChainId]: [sendTxDetailsConfirmed, sendTxDetailsFailed],
              [ChainId.Bnb as ChainId]: [sendTxDetailsPending, sendTxDetailsConfirmed],
            },
          },
        }),
      })

      const section = result.current.sections[0]!
      expect(section.title).toEqual('Recent')
      // This method doesn't check the order of the elements
      expect(section.data).toIncludeSameMembers([
        {
          address: sendTxDetailsPending.typeInfo.recipient,
          name: '',
        },
        {
          address: sendTxDetailsConfirmed.typeInfo.recipient,
          name: '',
        },
        {
          address: sendTxDetailsFailed.typeInfo.recipient,
          name: '',
        },
      ])
    })

    it('sorts recipients by most recent transaction', () => {
      const { result } = renderHookWithProviders(useRecipients, {
        preloadedState: getPreloadedState({
          transactions: {
            [activeAccount.address]: {
              [sendTxDetailsPending.chainId]: [
                sendTxDetailsPending,
                sendTxDetailsFailed,
                sendTxDetailsConfirmed,
              ],
            },
          },
        }),
      })

      expect(result.current).toEqual(
        expect.objectContaining({
          sections: expect.arrayContaining([recentRecipientsSectionResult]),
        })
      )
    })

    it('searchableRecipientOptions contains recent recipients', () => {
      const { result } = renderHookWithProviders(useRecipients, {
        preloadedState: getPreloadedState({
          transactions: {
            [activeAccount.address]: {
              [ChainId.Base as ChainId]: [sendTxDetailsPending, sendTxDetailsConfirmed],
              [ChainId.Mainnet as ChainId]: [sendTxDetailsConfirmed, sendTxDetailsFailed],
              [ChainId.Bnb as ChainId]: [sendTxDetailsPending, sendTxDetailsConfirmed],
            },
          },
        }),
      })

      expect(result.current.searchableRecipientOptions).toEqual(recentRecipients)
    })
  })

  describe('Inactive local accounts', () => {
    it('result does not contain Your wallets section if there are no inactive accounts', () => {
      const { result } = renderHookWithProviders(useRecipients, {
        preloadedState: getPreloadedState(),
      })

      expect(result.current).toEqual(
        expect.objectContaining({
          sections: expect.not.arrayContaining([
            expect.objectContaining({ title: 'Your wallets' }),
          ]),
        })
      )
    })

    it('result contains Your wallets section if there are inactive accounts', () => {
      const { result } = renderHookWithProviders(useRecipients, {
        preloadedState: getPreloadedState({ hasInactiveAccounts: true }),
      })

      expect(result.current).toEqual(
        expect.objectContaining({
          sections: expect.arrayContaining([inactiveWalletsSectionResult]),
        })
      )
    })

    it('searchableRecipientOptions contains inactive accounts', () => {
      const { result } = renderHookWithProviders(useRecipients, {
        preloadedState: getPreloadedState({ hasInactiveAccounts: true }),
      })

      expect(result.current).toEqual(
        expect.objectContaining({
          searchableRecipientOptions: [{ data: inactiveAccount, key: inactiveAccount.address }],
        })
      )
    })
  })

  describe('Watched wallets', () => {
    it('result does not contain Favorite Wallets section if there are no watched wallets', () => {
      const { result } = renderHookWithProviders(useRecipients, {
        preloadedState: getPreloadedState(),
      })

      expect(result.current).toEqual(
        expect.objectContaining({
          sections: expect.not.arrayContaining([
            expect.objectContaining({ title: 'Favorite wallets' }),
          ]),
        })
      )
    })

    it('result contains Favorite Wallets section if there are watched wallets', () => {
      const { result } = renderHookWithProviders(useRecipients, {
        preloadedState: getPreloadedState({
          watchedAddresses,
        }),
      })

      expect(result.current).toEqual(
        expect.objectContaining({
          sections: expect.arrayContaining([favoriteWalletsSectionResult]),
        })
      )
    })
  })

  describe('multiple sections', () => {
    it('result contains all sections', async () => {
      const { result } = renderHookWithProviders(useRecipients, {
        preloadedState: getPreloadedState({
          watchedAddresses,
          hasInactiveAccounts: true,
          transactions: {
            [activeAccount.address]: {
              [ChainId.Base as ChainId]: [sendTxDetailsPending, sendTxDetailsConfirmed],
              [ChainId.Mainnet as ChainId]: [sendTxDetailsConfirmed, sendTxDetailsFailed],
              [ChainId.Bnb as ChainId]: [sendTxDetailsPending, sendTxDetailsConfirmed],
            },
          },
        }),
      })

      await act(() => {
        result.current.onChangePattern(SAMPLE_SEED_ADDRESS_1)
      })

      await waitFor(() => {
        expect(result.current).toEqual(
          expect.objectContaining({
            sections: expect.arrayContaining([
              searchSectionResult,
              recentRecipientsSectionResult,
              inactiveWalletsSectionResult,
              favoriteWalletsSectionResult,
            ]),
          })
        )
      })
    })

    it('searchableRecipientOptions contains all unique recipients', async () => {
      const { result } = renderHookWithProviders(useRecipients, {
        preloadedState: getPreloadedState({
          watchedAddresses,
          hasInactiveAccounts: true,
          transactions: {
            [activeAccount.address]: {
              [ChainId.Base as ChainId]: [sendTxDetailsPending, sendTxDetailsConfirmed],
              [ChainId.Mainnet as ChainId]: [sendTxDetailsConfirmed, sendTxDetailsFailed],
              [ChainId.Bnb as ChainId]: [sendTxDetailsPending, sendTxDetailsConfirmed],
            },
          },
        }),
      })

      await act(() => {
        result.current.onChangePattern(SAMPLE_SEED_ADDRESS_1)
      })

      await waitFor(() => {
        expect(result.current.searchableRecipientOptions).toEqual([
          // Validated address recipient
          { data: validatedAddressRecipient, key: validatedAddressRecipient.address },
          // Inactive local accounts
          { data: inactiveAccount, key: inactiveAccount.address },
          // Recent recipients
          ...recentRecipients,
        ])
      })
    })
  })
})
