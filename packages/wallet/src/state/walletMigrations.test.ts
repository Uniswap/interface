/**
 * Isolated tests for individual migration functions.
 *
 * Tests each migration independently with various input states, edge cases,
 * and error handling, without relying on output from previous migrations.
 *
 * For tests of the full migration chain, see walletMigrationsTests.ts.
 */
import { RankingType } from '@universe/api'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { createThrowingProxy } from 'utilities/src/test/utils'
import {
  addBatchedTransactions,
  addCreatedOnboardingRedesignAccountBehaviorHistory,
  addExploreAndWelcomeBehaviorHistory,
  addHapticSetting,
  addRoutingFieldToTransactions,
  deleteBetaOnboardingState,
  deleteDefaultFavoritesFromFavoritesState,
  deleteExtensionOnboardingState,
  deleteHoldToSwapBehaviorHistory,
  deleteWelcomeWalletCardBehaviorHistory,
  HAYDEN_ETH_ADDRESS,
  migrateLiquidityTransactionInfo,
  moveCurrencySetting,
  moveDismissedTokenWarnings,
  moveHapticsToUserSettings,
  moveLanguageSetting,
  moveTokenAndNFTVisibility,
  moveUserSettings,
  removeCreatedOnboardingRedesignAccountBehaviorHistory,
  removePriceAlertsEnabledFromPushNotifications,
  removeUniconV2BehaviorState,
  removeWalletIsUnlockedState,
  updateExploreOrderByType,
} from 'wallet/src/state/walletMigrations'

describe('removeWalletIsUnlockedState', () => {
  it('removes isUnlocked from wallet state', () => {
    const state = { wallet: { isUnlocked: true, accounts: {} } }
    const result = removeWalletIsUnlockedState(state)
    expect(result.wallet.isUnlocked).toBeUndefined()
    expect(result.wallet.accounts).toEqual({})
  })

  it('handles missing wallet state', () => {
    const state = { otherData: 'preserved' }
    const result = removeWalletIsUnlockedState(state)
    expect(result.otherData).toBe('preserved')
  })
})

describe('removeUniconV2BehaviorState', () => {
  it('removes hasViewedUniconV2IntroModal from behaviorHistory', () => {
    const state = { behaviorHistory: { hasViewedUniconV2IntroModal: true, otherFlag: false } }
    const result = removeUniconV2BehaviorState(state)
    expect(result.behaviorHistory.hasViewedUniconV2IntroModal).toBeUndefined()
    expect(result.behaviorHistory.otherFlag).toBe(false)
  })

  it('handles missing behaviorHistory', () => {
    const state = { otherData: 'preserved' }
    const result = removeUniconV2BehaviorState(state)
    expect(result.otherData).toBe('preserved')
  })
})

describe('addRoutingFieldToTransactions', () => {
  it('adds routing field to all transactions', () => {
    const state = {
      transactions: {
        '0x123': {
          1: {
            tx1: { id: 'tx1', chainId: 1 },
          },
        },
      },
    }
    const result = addRoutingFieldToTransactions(state)
    expect(result.transactions['0x123'][1].tx1.routing).toBe('CLASSIC')
  })

  it('handles empty transactions', () => {
    const state = { transactions: {} }
    const result = addRoutingFieldToTransactions(state)
    expect(result.transactions).toEqual({})
  })

  it('handles missing transactions state', () => {
    const state = { otherData: 'preserved' }
    const result = addRoutingFieldToTransactions(state)
    expect(result.transactions).toEqual({})
  })

  it('falls back to empty transactions on error', () => {
    const state = {
      transactions: createThrowingProxy({}, { throwingMethods: ['*'] }),
      otherData: 'preserved',
    }
    const result = addRoutingFieldToTransactions(state)
    expect(result.transactions).toEqual({})
    expect(result.otherData).toBe('preserved')
  })
})

describe('deleteBetaOnboardingState', () => {
  it('removes extensionBetaFeedbackState from behaviorHistory', () => {
    const state = { behaviorHistory: { extensionBetaFeedbackState: 'completed', otherFlag: true } }
    const result = deleteBetaOnboardingState(state)
    expect(result.behaviorHistory.extensionBetaFeedbackState).toBeUndefined()
    expect(result.behaviorHistory.otherFlag).toBe(true)
  })

  it('handles missing behaviorHistory', () => {
    const state = { otherData: 'preserved' }
    const result = deleteBetaOnboardingState(state)
    expect(result.otherData).toBe('preserved')
  })
})

describe('deleteExtensionOnboardingState', () => {
  it('removes extensionOnboardingState from behaviorHistory', () => {
    const state = { behaviorHistory: { extensionOnboardingState: 1, otherFlag: true } }
    const result = deleteExtensionOnboardingState(state)
    expect(result.behaviorHistory.extensionOnboardingState).toBeUndefined()
    expect(result.behaviorHistory.otherFlag).toBe(true)
  })

  it('handles missing behaviorHistory', () => {
    const state = { otherData: 'preserved' }
    const result = deleteExtensionOnboardingState(state)
    expect(result.otherData).toBe('preserved')
  })
})

describe('deleteDefaultFavoritesFromFavoritesState', () => {
  it('removes default watched addresses', () => {
    const state = {
      favorites: {
        watchedAddresses: [HAYDEN_ETH_ADDRESS, '0xOtherAddress'],
      },
    }
    const result = deleteDefaultFavoritesFromFavoritesState(state)
    expect(result.favorites.watchedAddresses).toEqual(['0xOtherAddress'])
  })

  it('handles missing favorites state', () => {
    const state = { otherData: 'preserved' }
    const result = deleteDefaultFavoritesFromFavoritesState(state)
    expect(result.otherData).toBe('preserved')
  })

  it('handles non-array watchedAddresses', () => {
    const state = { favorites: { watchedAddresses: 'invalid' } }
    const result = deleteDefaultFavoritesFromFavoritesState(state)
    expect(result).toEqual(state)
  })

  it('falls back to empty watchedAddresses on error', () => {
    const state = {
      favorites: { watchedAddresses: createThrowingProxy([], { throwingMethods: ['filter'] }) },
      otherData: 'preserved',
    }
    const result = deleteDefaultFavoritesFromFavoritesState(state)
    expect(result.favorites.watchedAddresses).toEqual([])
    expect(result.otherData).toBe('preserved')
  })
})

describe('addHapticSetting', () => {
  it('adds hapticsEnabled to appearanceSettings', () => {
    const state = { appearanceSettings: { selectedAppearanceSettings: 'system' } }
    const result = addHapticSetting(state)
    expect(result.appearanceSettings.hapticsEnabled).toBe(true)
    expect(result.appearanceSettings.selectedAppearanceSettings).toBe('system')
  })

  it('handles missing appearanceSettings', () => {
    const state = { otherData: 'preserved' }
    const result = addHapticSetting(state)
    expect(result.appearanceSettings.hapticsEnabled).toBe(true)
  })
})

describe('addExploreAndWelcomeBehaviorHistory', () => {
  it('adds hasViewedWelcomeWalletCard and hasUsedExplore to behaviorHistory', () => {
    const state = { behaviorHistory: { otherFlag: true } }
    const result = addExploreAndWelcomeBehaviorHistory(state)
    expect(result.behaviorHistory.hasViewedWelcomeWalletCard).toBe(false)
    expect(result.behaviorHistory.hasUsedExplore).toBe(false)
    expect(result.behaviorHistory.otherFlag).toBe(true)
  })
})

describe('moveUserSettings', () => {
  it('moves hideSmallBalances and hideSpamTokens to userSettings', () => {
    const state = {
      wallet: {
        settings: {
          hideSmallBalances: false,
          hideSpamTokens: false,
          swapProtection: 'on',
        },
      },
    }
    const result = moveUserSettings(state)
    expect(result.userSettings.hideSmallBalances).toBe(false)
    expect(result.userSettings.hideSpamTokens).toBe(false)
    expect(result.wallet.settings.hideSmallBalances).toBeUndefined()
    expect(result.wallet.settings.hideSpamTokens).toBeUndefined()
  })

  it('defaults to true when settings are missing', () => {
    const state = { wallet: { settings: {} } }
    const result = moveUserSettings(state)
    expect(result.userSettings.hideSmallBalances).toBe(true)
    expect(result.userSettings.hideSpamTokens).toBe(true)
  })
})

describe('deleteHoldToSwapBehaviorHistory', () => {
  it('removes hasViewedReviewScreen and hasSubmittedHoldToSwap from behaviorHistory', () => {
    const state = {
      behaviorHistory: {
        hasViewedReviewScreen: true,
        hasSubmittedHoldToSwap: true,
        otherFlag: true,
      },
    }
    const result = deleteHoldToSwapBehaviorHistory(state)
    expect(result.behaviorHistory.hasViewedReviewScreen).toBeUndefined()
    expect(result.behaviorHistory.hasSubmittedHoldToSwap).toBeUndefined()
    expect(result.behaviorHistory.otherFlag).toBe(true)
  })
})

describe('addCreatedOnboardingRedesignAccountBehaviorHistory', () => {
  it('adds createdOnboardingRedesignAccount to behaviorHistory', () => {
    const state = { behaviorHistory: { otherFlag: true } }
    const result = addCreatedOnboardingRedesignAccountBehaviorHistory(state)
    expect(result.behaviorHistory.createdOnboardingRedesignAccount).toBe(false)
    expect(result.behaviorHistory.otherFlag).toBe(true)
  })
})

describe('moveDismissedTokenWarnings', () => {
  it('moves warnings from currencyId format to chainId/address format', () => {
    const state = {
      tokens: {
        dismissedWarningTokens: {
          '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': true,
        },
      },
    }
    const result = moveDismissedTokenWarnings(state)
    expect(result.tokens.dismissedTokenWarnings[1]['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48']).toBeDefined()
  })

  it('handles missing tokens state', () => {
    const state = { otherData: 'preserved' }
    const result = moveDismissedTokenWarnings(state)
    expect(result.otherData).toBe('preserved')
  })

  it('handles non-object dismissedWarningTokens', () => {
    const state = { tokens: { dismissedWarningTokens: 'invalid' } }
    const result = moveDismissedTokenWarnings(state)
    expect(result).toEqual(state)
  })

  it('falls back to empty warnings on error', () => {
    const state = {
      tokens: { dismissedWarningTokens: createThrowingProxy({}, { throwingMethods: ['*'] }) },
      otherData: 'preserved',
    }
    const result = moveDismissedTokenWarnings(state)
    expect(result.tokens.dismissedTokenWarnings).toEqual({})
    expect(result.otherData).toBe('preserved')
  })
})

describe('moveLanguageSetting', () => {
  it('moves currentLanguage from languageSettings to userSettings', () => {
    const state = {
      languageSettings: { currentLanguage: 'es-ES' },
      userSettings: { hideSmallBalances: true },
    }
    const result = moveLanguageSetting(state)
    expect(result.userSettings.currentLanguage).toBe('es-ES')
    expect(result.languageSettings).toBeUndefined()
  })

  it('defaults to English when languageSettings is missing', () => {
    const state = { userSettings: {} }
    const result = moveLanguageSetting(state)
    expect(result.userSettings.currentLanguage).toBe('en')
  })
})

describe('moveCurrencySetting', () => {
  it('moves currentCurrency from fiatCurrencySettings to userSettings', () => {
    const state = {
      fiatCurrencySettings: { currentCurrency: FiatCurrency.Euro },
      userSettings: { hideSmallBalances: true },
    }
    const result = moveCurrencySetting(state)
    expect(result.userSettings.currentCurrency).toBe(FiatCurrency.Euro)
    expect(result.fiatCurrencySettings).toBeUndefined()
  })

  it('defaults to USD when fiatCurrencySettings is missing', () => {
    const state = { userSettings: {} }
    const result = moveCurrencySetting(state)
    expect(result.userSettings.currentCurrency).toBe(FiatCurrency.UnitedStatesDollar)
  })
})

describe('updateExploreOrderByType', () => {
  it('sets tokensOrderBy to Volume in wallet settings', () => {
    const state = { wallet: { settings: {} } }
    const result = updateExploreOrderByType(state)
    expect(result.wallet.settings.tokensOrderBy).toBe(RankingType.Volume)
  })

  it('handles missing wallet state', () => {
    const state = { otherData: 'preserved' }
    const result = updateExploreOrderByType(state)
    expect(result.wallet.settings.tokensOrderBy).toBe(RankingType.Volume)
  })
})

describe('removeCreatedOnboardingRedesignAccountBehaviorHistory', () => {
  it('removes createdOnboardingRedesignAccount from behaviorHistory', () => {
    const state = { behaviorHistory: { createdOnboardingRedesignAccount: true, otherFlag: true } }
    const result = removeCreatedOnboardingRedesignAccountBehaviorHistory(state)
    expect(result.behaviorHistory.createdOnboardingRedesignAccount).toBeUndefined()
    expect(result.behaviorHistory.otherFlag).toBe(true)
  })

  it('handles missing behaviorHistory', () => {
    const state = { otherData: 'preserved' }
    const result = removeCreatedOnboardingRedesignAccountBehaviorHistory(state)
    expect(result.behaviorHistory).toEqual({})
  })
})

describe('deleteWelcomeWalletCardBehaviorHistory', () => {
  it('removes hasViewedWelcomeWalletCard from behaviorHistory', () => {
    const state = { behaviorHistory: { hasViewedWelcomeWalletCard: true, otherFlag: true } }
    const result = deleteWelcomeWalletCardBehaviorHistory(state)
    expect(result.behaviorHistory.hasViewedWelcomeWalletCard).toBeUndefined()
    expect(result.behaviorHistory.otherFlag).toBe(true)
  })
})

describe('moveTokenAndNFTVisibility', () => {
  it('moves tokensVisibility and nftsVisibility from favorites to visibility', () => {
    const state = {
      favorites: {
        tokens: [],
        tokensVisibility: { token1: true },
        nftsVisibility: { nft1: false },
      },
    }
    const result = moveTokenAndNFTVisibility(state)
    expect(result.visibility.tokens).toEqual({ token1: true })
    expect(result.visibility.nfts).toEqual({ nft1: false })
    expect(result.visibility.positions).toEqual({})
    expect(result.favorites.tokensVisibility).toBeUndefined()
    expect(result.favorites.nftsVisibility).toBeUndefined()
  })

  it('handles missing favorites state', () => {
    const state = { otherData: 'preserved' }
    const result = moveTokenAndNFTVisibility(state)
    expect(result.visibility.tokens).toEqual({})
    expect(result.visibility.nfts).toEqual({})
  })
})

describe('addBatchedTransactions', () => {
  it('adds empty batchedTransactions object', () => {
    const state = { otherData: 'preserved' }
    const result = addBatchedTransactions(state)
    expect(result.batchedTransactions).toEqual({})
    expect(result.otherData).toBe('preserved')
  })
})

describe('moveHapticsToUserSettings', () => {
  it('moves hapticsEnabled from appearanceSettings to userSettings', () => {
    const state = {
      appearanceSettings: { hapticsEnabled: false, selectedAppearanceSettings: 'dark' },
      userSettings: { hideSmallBalances: true },
    }
    const result = moveHapticsToUserSettings(state)
    expect(result.userSettings.hapticsEnabled).toBe(false)
    expect(result.appearanceSettings.hapticsEnabled).toBeUndefined()
    expect(result.appearanceSettings.selectedAppearanceSettings).toBe('dark')
  })

  it('defaults to true when hapticsEnabled is missing', () => {
    const state = { appearanceSettings: {}, userSettings: {} }
    const result = moveHapticsToUserSettings(state)
    expect(result.userSettings.hapticsEnabled).toBe(true)
  })
})

describe('migrateLiquidityTransactionInfo', () => {
  it('renames input/output fields to currency0/currency1 for liquidity transactions', () => {
    const state = {
      transactions: {
        '0x123': {
          1: {
            tx1: {
              id: 'tx1',
              typeInfo: {
                type: TransactionType.LiquidityIncrease,
                inputCurrencyId: 'token0',
                inputCurrencyAmountRaw: '1000',
                outputCurrencyId: 'token1',
                outputCurrencyAmountRaw: '2000',
              },
            },
          },
        },
      },
    }
    const result = migrateLiquidityTransactionInfo(state)
    const txTypeInfo = result.transactions['0x123'][1].tx1.typeInfo
    expect(txTypeInfo.currency0Id).toBe('token0')
    expect(txTypeInfo.currency0AmountRaw).toBe('1000')
    expect(txTypeInfo.currency1Id).toBe('token1')
    expect(txTypeInfo.currency1AmountRaw).toBe('2000')
    expect(txTypeInfo.inputCurrencyId).toBeUndefined()
    expect(txTypeInfo.outputCurrencyId).toBeUndefined()
  })

  it('does not modify non-liquidity transactions', () => {
    const state = {
      transactions: {
        '0x123': {
          1: {
            tx1: {
              id: 'tx1',
              typeInfo: {
                type: TransactionType.Swap,
                inputCurrencyId: 'token0',
              },
            },
          },
        },
      },
    }
    const result = migrateLiquidityTransactionInfo(state)
    expect(result.transactions['0x123'][1].tx1.typeInfo.inputCurrencyId).toBe('token0')
  })

  it('handles missing transactions state', () => {
    const state = { otherData: 'preserved' }
    const result = migrateLiquidityTransactionInfo(state)
    expect(result.transactions).toEqual({})
  })

  it('falls back to empty transactions on error', () => {
    const state = {
      transactions: createThrowingProxy({}, { throwingMethods: ['*'] }),
      otherData: 'preserved',
    }
    const result = migrateLiquidityTransactionInfo(state)
    expect(result.transactions).toEqual({})
    expect(result.otherData).toBe('preserved')
  })
})

describe('removePriceAlertsEnabledFromPushNotifications', () => {
  it('removes priceAlertsEnabled from pushNotifications', () => {
    const state = { pushNotifications: { priceAlertsEnabled: true, otherSetting: false } }
    const result = removePriceAlertsEnabledFromPushNotifications(state)
    expect(result.pushNotifications.priceAlertsEnabled).toBeUndefined()
    expect(result.pushNotifications.otherSetting).toBe(false)
  })

  it('handles missing pushNotifications state', () => {
    const state = { otherData: 'preserved' }
    const result = removePriceAlertsEnabledFromPushNotifications(state)
    expect(result.otherData).toBe('preserved')
  })
})
