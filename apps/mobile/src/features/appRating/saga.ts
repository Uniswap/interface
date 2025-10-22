import { Alert, Platform } from 'react-native'
import { call, delay, put, select, takeLatest } from 'typed-redux-saga'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { finalizeTransaction } from 'uniswap/src/features/transactions/slice'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { openUri } from 'uniswap/src/utils/linking'
import { isTestRun } from 'utilities/src/environment/constants'
import { logger } from 'utilities/src/logger/logger'
import { isAndroid } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { appRatingStateSelector } from 'wallet/src/features/appRating/selectors'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'
import { setAppRating } from 'wallet/src/features/wallet/slice'

function isAndroid14(): boolean {
  return isAndroid && Platform.Version === 34
}

// small delay to help ux
const SWAP_FINALIZED_PROMPT_DELAY_MS = 3 * ONE_SECOND_MS

try {
  if (!isTestRun && !isAndroid14()) {
    import('expo-store-review')
  }
} catch (error) {
  const message = error instanceof Error ? error.message : 'Store Review import error'
  logger.warn('appRating/saga.ts', 'init', message)
}

// Wrap the StoreReview import in a function that catches the specific error
const getStoreReview = async () => {
  try {
    return await import('expo-store-review')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Store Review import error'
    logger.warn('appRating/saga.ts', 'getStoreReview', message)
    return undefined
  }
}

export function* appRatingWatcherSaga() {
  function* processFinalizedTx(action: ReturnType<typeof finalizeTransaction>) {
    // count successful swaps
    if (action.payload.typeInfo.type === TransactionType.Swap && action.payload.status === TransactionStatus.Success) {
      yield* delay(SWAP_FINALIZED_PROMPT_DELAY_MS)
      yield* call(maybeRequestAppRating)
    }
  }

  yield* takeLatest(finalizeTransaction.type, processFinalizedTx)
}

function* maybeRequestAppRating() {
  try {
    const StoreReview = yield* call(getStoreReview)
    if (!StoreReview) {
      logger.warn('appRating/saga.ts', 'maybeRequestAppRating', 'StoreReview not available')
      return
    }

    const canRequestReview = yield* call(StoreReview.hasAction)
    if (!canRequestReview) {
      return
    }

    const activeAddress = yield* select(selectActiveAccountAddress)
    if (!activeAddress) {
      return
    }

    const { shouldPrompt, appRatingProvidedMs, appRatingPromptedMs, consecutiveSwapsCondition } =
      yield* select(appRatingStateSelector)

    if (!shouldPrompt) {
      logger.debug('appRating', 'maybeRequestAppRating', 'Skipping app rating', {
        lastPrompt: appRatingPromptedMs,
        lastProvided: appRatingProvidedMs,
        consecutiveSwapsCondition,
      })
      return
    }

    logger.debug('appRating', 'maybeRequestAppRating', 'Requesting app rating', {
      lastPrompt: appRatingPromptedMs,
      lastProvided: appRatingProvidedMs,
      consecutiveSwapsCondition,
    })

    // Alerts
    const shouldShowNativeReviewModal = yield* call(openRatingOptionsAlert)

    if (shouldShowNativeReviewModal) {
      // expo-review does not return whether a rating was actually provided.
      // assume it was and mark rating as provided.
      yield* put(setAppRating({ ratingProvided: true }))

      sendAnalyticsEvent(WalletEventName.AppRating, {
        type: 'store-review',
        appRatingPromptedMs,
        appRatingProvidedMs,
      })
    } else {
      // show feedback form
      const feedbackSent = yield* call(openFeedbackRequestAlert)

      if (feedbackSent) {
        yield* put(setAppRating({ feedbackProvided: true }))

        sendAnalyticsEvent(WalletEventName.AppRating, {
          type: 'feedback-form',
          appRatingPromptedMs,
          appRatingProvidedMs,
        })
      } else {
        yield* put(setAppRating({ feedbackProvided: false }))

        sendAnalyticsEvent(WalletEventName.AppRating, {
          type: 'remind',
          appRatingPromptedMs,
          appRatingProvidedMs,
        })
      }
    }
  } catch (e) {
    logger.error(e, { tags: { file: 'appRating', function: 'maybeRequestAppRating' } })
  }
}

/**
 * Opens the app rating request alert. Either opens the native review modal
 * or the feedback form if user wishes to provide feedback.
 */
async function openRatingOptionsAlert() {
  return new Promise((resolve) => {
    Alert.alert(i18n.t('appRating.mobile.title'), i18n.t('appRating.description'), [
      {
        text: i18n.t('appRating.button.notReally'),
        onPress: () => resolve(false),
        style: 'cancel',
      },
      {
        text: i18n.t('common.button.yes'),
        onPress: () => {
          openNativeReviewModal().catch((e) =>
            logger.error(e, {
              tags: { file: 'appRating/saga', function: 'openRatingOptionsAlert' },
            }),
          )
          resolve(true)
        },
        isPreferred: true,
      },
    ])
  })
}

/** Opens feedback request modal which will redirect to our feedback form. */
async function openFeedbackRequestAlert() {
  return new Promise((resolve) => {
    Alert.alert(i18n.t('appRating.feedback.title'), i18n.t('appRating.feedback.description'), [
      {
        text: i18n.t('appRating.feedback.button.send'),
        onPress: () => {
          openUri({ uri: uniswapUrls.walletFeedbackForm }).catch((e) =>
            logger.error(e, { tags: { file: 'appRating/saga', function: 'openFeedbackAlert' } }),
          )
          resolve(true)
        },
        isPreferred: true,
      },
      {
        text: i18n.t('common.button.later'),
        onPress: () => resolve(false),
        style: 'cancel',
      },
    ])
  })
}

/** Opens the native store review modal that will send the rating to the store. */
async function openNativeReviewModal() {
  try {
    const StoreReview = await getStoreReview()
    if (StoreReview && (await StoreReview.hasAction())) {
      await StoreReview.requestReview()
    }
  } catch (e) {
    logger.error(e, { tags: { file: 'appRating/saga', function: 'openNativeReviewModal' } })
  }
}
