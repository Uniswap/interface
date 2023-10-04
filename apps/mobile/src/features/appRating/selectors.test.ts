import { hasConsecutiveSuccessfulSwapsSelector } from 'src/features/appRating/selectors'
import { ChainId } from 'wallet/src/constants/chains'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { RootState } from 'wallet/src/state'
import { account, mockWalletPreloadedState } from 'wallet/src/test/fixtures'

const MOCK_DATE_PROMPTED = 1000

const state = {
  ...mockWalletPreloadedState,
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
    const isConsecutiveSwaps = hasConsecutiveSuccessfulSwapsSelector({
      ...state,
      transactions: {},
    })

    expect(isConsecutiveSwaps).toBeFalsy()
  })

  it('returns false when no new swaps since prompt', () => {
    const condition = hasConsecutiveSuccessfulSwapsSelector({
      ...state,
      wallet: { appRatingPromptedMs: MOCK_DATE_PROMPTED + 2000 },
    } as RootState)

    expect(condition).toBeFalsy()
  })

  it('returns false when last swaps contain failure', () => {
    const isConsecutiveSwaps = hasConsecutiveSuccessfulSwapsSelector({
      ...state,
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
    const isConsecutiveSwaps = hasConsecutiveSuccessfulSwapsSelector({
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

  it('returns true for consecutive swaps', () => {
    const isConsecutiveSwaps = hasConsecutiveSuccessfulSwapsSelector(state)

    expect(isConsecutiveSwaps).toBeTruthy()
  })
})
