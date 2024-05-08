import { hasConsecutiveRecentSwapsSelector } from 'src/features/appRating/selectors'
import { ONE_HOUR_MS, ONE_MINUTE_MS } from 'utilities/src/time/time'
import { ChainId } from 'wallet/src/constants/chains'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { RootState } from 'wallet/src/state'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'
import { preloadedWalletState } from 'wallet/src/test/fixtures/wallet/redux'

const account = signerMnemonicAccount()

const MOCK_DATE_PROMPTED = Date.now()

const state = {
  ...preloadedWalletState(),
  wallet: {
    appRatingProvidedMs: MOCK_DATE_PROMPTED,
  },
  transactions: {
    [account.address]: {
      [ChainId.Mainnet]: {
        '0x123': {
          addedTime: MOCK_DATE_PROMPTED + 1000,
          typeInfo: { type: TransactionType.Swap },
          status: TransactionStatus.Success,
        } as TransactionDetails,
        '0x456': {
          addedTime: MOCK_DATE_PROMPTED + 1000,
          typeInfo: { type: TransactionType.Swap },
          status: TransactionStatus.Success,
        } as TransactionDetails,
        '0x890': {
          addedTime: MOCK_DATE_PROMPTED + 1000,
          typeInfo: { type: TransactionType.Approve },
          status: TransactionStatus.Success,
        } as TransactionDetails,
      },
    },
  },
} as unknown as RootState

describe('consecutiveSwapsSelector', () => {
  it('returns false for empty state', () => {
    const isConsecutiveSwaps = hasConsecutiveRecentSwapsSelector({
      ...state,
      transactions: {},
    })

    expect(isConsecutiveSwaps).toBeFalsy()
  })

  it('returns false when no new swaps since prompt', () => {
    const condition = hasConsecutiveRecentSwapsSelector({
      ...state,
      wallet: { appRatingPromptedMs: MOCK_DATE_PROMPTED + 2000 },
    } as RootState)

    expect(condition).toBeFalsy()
  })

  it('returns false when last swaps contain failure', () => {
    const isConsecutiveSwaps = hasConsecutiveRecentSwapsSelector({
      ...state,
      transactions: {
        [account.address]: {
          [ChainId.Mainnet]: {
            '0x123': {
              addedTime: MOCK_DATE_PROMPTED,
              typeInfo: { type: TransactionType.Swap },
              status: TransactionStatus.Success,
            } as TransactionDetails,
            '0x456': {
              addedTime: MOCK_DATE_PROMPTED + 500,
              typeInfo: { type: TransactionType.Swap },
              status: TransactionStatus.Success,
            } as TransactionDetails,
            '0x890': {
              addedTime: MOCK_DATE_PROMPTED + 1000,
              typeInfo: { type: TransactionType.Swap },
              status: TransactionStatus.Failed,
            } as TransactionDetails,
          },
        },
      },
    })

    expect(isConsecutiveSwaps).toBeFalsy()
  })

  it('returns false for consecutive success, but not swap type', () => {
    const isConsecutiveSwaps = hasConsecutiveRecentSwapsSelector({
      ...state,
      transactions: {
        [account.address]: {
          [ChainId.Mainnet]: {
            '0x123': {
              addedTime: MOCK_DATE_PROMPTED + 1000,
              typeInfo: { type: TransactionType.Swap },
              status: TransactionStatus.Success,
            } as TransactionDetails,
            '0x890': {
              addedTime: MOCK_DATE_PROMPTED + 1000,
              typeInfo: { type: TransactionType.Approve },
              status: TransactionStatus.Success,
            } as TransactionDetails,
          },
        },
      },
    })

    expect(isConsecutiveSwaps).toBeFalsy()
  })

  it('returns false when last swap was done over a min ago', () => {
    const isConsecutiveSwaps = hasConsecutiveRecentSwapsSelector({
      ...state,
      transactions: {
        [account.address]: {
          [ChainId.Mainnet]: {
            '0x123': {
              addedTime: MOCK_DATE_PROMPTED - ONE_HOUR_MS,
              typeInfo: { type: TransactionType.Swap },
              status: TransactionStatus.Success,
            } as TransactionDetails,
            '0x456': {
              addedTime: MOCK_DATE_PROMPTED - 2 * ONE_MINUTE_MS,
              typeInfo: { type: TransactionType.Swap },
              status: TransactionStatus.Success,
            } as TransactionDetails,
          },
        },
      },
    })

    expect(isConsecutiveSwaps).toBeFalsy()
  })

  it('returns true for consecutive swaps', () => {
    const isConsecutiveSwaps = hasConsecutiveRecentSwapsSelector(state)

    expect(isConsecutiveSwaps).toBeTruthy()
  })
})
