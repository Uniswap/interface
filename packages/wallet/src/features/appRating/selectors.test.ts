import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ONE_HOUR_MS, ONE_MINUTE_MS } from 'utilities/src/time/time'
import {
  appRatingStateSelector,
  hasConsecutiveRecentSwapsSelector,
  MIN_FEEDBACK_REMINDER_MS,
  MIN_PROMPT_REMINDER_MS,
} from 'wallet/src/features/appRating/selectors'
import { WalletState } from 'wallet/src/state/walletReducer'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'
import { preloadedWalletReducerState } from 'wallet/src/test/fixtures/wallet/redux'

const account = signerMnemonicAccount()

const MOCK_DATE_PROMPTED = Date.now()

const state = {
  ...preloadedWalletReducerState(),
  wallet: {
    appRatingProvidedMs: MOCK_DATE_PROMPTED,
  },
  transactions: {
    [account.address]: {
      [UniverseChainId.Mainnet]: {
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
} as unknown as WalletState

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
    } as unknown as WalletState)

    expect(condition).toBeFalsy()
  })

  it('returns false when last swaps contain failure', () => {
    const isConsecutiveSwaps = hasConsecutiveRecentSwapsSelector({
      ...state,
      transactions: {
        [account.address]: {
          [UniverseChainId.Mainnet]: {
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
          [UniverseChainId.Mainnet]: {
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
          [UniverseChainId.Mainnet]: {
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

describe('appRatingStateSelector', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => MOCK_DATE_PROMPTED)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns correct state when never prompted before', () => {
    const baseState = {
      ...state,
      wallet: {
        appRatingProvidedMs: undefined,
        appRatingPromptedMs: undefined,
        appRatingFeedbackProvidedMs: undefined,
      },
    } as WalletState

    const result = appRatingStateSelector(baseState)

    expect(result).toEqual({
      appRatingPromptedMs: undefined,
      appRatingProvidedMs: undefined,
      consecutiveSwapsCondition: true,
      shouldPrompt: true,
    })
  })

  it('returns shouldPrompt false when consecutive swaps condition is false', () => {
    const baseState = {
      ...state,
      wallet: {
        appRatingProvidedMs: undefined,
        appRatingPromptedMs: undefined,
        appRatingFeedbackProvidedMs: undefined,
      },
      transactions: {},
    } as WalletState

    const result = appRatingStateSelector(baseState)

    expect(result).toEqual({
      appRatingPromptedMs: undefined,
      appRatingProvidedMs: undefined,
      consecutiveSwapsCondition: false,
      shouldPrompt: false,
    })
  })

  it('returns shouldPrompt true when enough time passed since last prompt', () => {
    const lastPromptTime = MOCK_DATE_PROMPTED - MIN_PROMPT_REMINDER_MS - ONE_HOUR_MS
    const baseState = {
      ...state,
      wallet: {
        appRatingProvidedMs: undefined,
        appRatingPromptedMs: lastPromptTime,
        appRatingFeedbackProvidedMs: undefined,
      },
    } as WalletState

    const result = appRatingStateSelector(baseState)

    expect(result).toEqual({
      appRatingPromptedMs: lastPromptTime,
      appRatingProvidedMs: undefined,
      consecutiveSwapsCondition: true,
      shouldPrompt: true,
    })
  })

  it('returns shouldPrompt false when not enough time passed since last prompt', () => {
    const lastPromptTime = MOCK_DATE_PROMPTED - MIN_PROMPT_REMINDER_MS + ONE_HOUR_MS
    const baseState = {
      ...state,
      wallet: {
        appRatingProvidedMs: undefined,
        appRatingPromptedMs: lastPromptTime,
        appRatingFeedbackProvidedMs: undefined,
      },
    } as WalletState

    const result = appRatingStateSelector(baseState)

    expect(result).toEqual({
      appRatingPromptedMs: lastPromptTime,
      appRatingProvidedMs: undefined,
      consecutiveSwapsCondition: true,
      shouldPrompt: false,
    })
  })

  it('returns shouldPrompt true when enough time passed since last feedback', () => {
    const lastFeedbackTime = MOCK_DATE_PROMPTED - MIN_FEEDBACK_REMINDER_MS - ONE_HOUR_MS
    const baseState = {
      ...state,
      wallet: {
        appRatingProvidedMs: undefined,
        appRatingPromptedMs: undefined,
        appRatingFeedbackProvidedMs: lastFeedbackTime,
      },
    } as WalletState

    const result = appRatingStateSelector(baseState)

    expect(result).toEqual({
      appRatingPromptedMs: undefined,
      appRatingProvidedMs: undefined,
      consecutiveSwapsCondition: true,
      shouldPrompt: true,
    })
  })

  it('returns shouldPrompt false when not enough time passed since last feedback', () => {
    const lastPromptTime = MOCK_DATE_PROMPTED - MIN_PROMPT_REMINDER_MS - ONE_HOUR_MS
    const lastFeedbackTime = MOCK_DATE_PROMPTED - MIN_FEEDBACK_REMINDER_MS + ONE_HOUR_MS
    const baseState = {
      ...state,
      wallet: {
        appRatingProvidedMs: undefined,
        appRatingPromptedMs: lastPromptTime,
        appRatingFeedbackProvidedMs: lastFeedbackTime,
      },
    } as WalletState

    const result = appRatingStateSelector(baseState)

    expect(result).toEqual({
      appRatingPromptedMs: lastPromptTime,
      appRatingProvidedMs: undefined,
      consecutiveSwapsCondition: true,
      shouldPrompt: false,
    })
  })
})
