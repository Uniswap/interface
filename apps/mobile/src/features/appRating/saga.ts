import * as StoreReview from 'expo-store-review'
import { Alert } from 'react-native'
import { APP_FEEDBACK_LINK } from 'src/constants/urls'
import { hasConsecutiveRecentSwapsSelector } from 'src/features/appRating/selectors'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { call, delay, put, select, takeLatest } from 'typed-redux-saga'
import { isAndroid } from 'uniswap/src/utils/platform'
import { logger } from 'utilities/src/logger/logger'
import { ONE_DAY_MS, ONE_SECOND_MS } from 'utilities/src/time/time'
import { finalizeTransaction } from 'wallet/src/features/transactions/slice'
import { TransactionStatus, TransactionType } from 'wallet/src/features/transactions/types'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'
import { setAppRating } from 'wallet/src/features/wallet/slice'
import { appSelect } from 'wallet/src/state'
import { openUri } from 'wallet/src/utils/linking'

// at most once per reminder period (120 days)
const MIN_PROMPT_REMINDER_MS = 120 * ONE_DAY_MS
// remind after a longer delay when user filled the feedback form (180 days)
const MIN_FEEDBACK_REMINDER_MS = 180 * ONE_DAY_MS
// small delay to help ux
const SWAP_FINALIZED_PROMPT_DELAY_MS = 3 * ONE_SECOND_MS

export function* appRatingWatcherSaga() {
  function* processFinalizedTx(action: ReturnType<typeof finalizeTransaction>) {
    // count successful swaps

    // TODO(MOB-1814): Remove once Android goes live
    if (isAndroid) {
      return
    }

    if (
      action.payload.typeInfo.type === TransactionType.Swap &&
      action.payload.status === TransactionStatus.Success
    ) {
      yield* delay(SWAP_FINALIZED_PROMPT_DELAY_MS)
      yield* call(maybeRequestAppRating)
    }
  }

  yield* takeLatest(finalizeTransaction.type, processFinalizedTx)
}

function* maybeRequestAppRating() {
  try {
    const canRequestReview = yield* call(StoreReview.hasAction)
    if (!canRequestReview) {
      return
    }

    const activeAddress = yield* select(selectActiveAccountAddress)
    if (!activeAddress) {
      return
    }

    // Conditions
    const appRatingProvidedMs = yield* appSelect((state) => state.wallet.appRatingProvidedMs)
    if (appRatingProvidedMs) {
      return
    } // avoids prompting again

    const appRatingPromptedMs = yield* appSelect((state) => state.wallet.appRatingPromptedMs)
    const appRatingFeedbackProvidedMs = yield* appSelect(
      (state) => state.wallet.appRatingFeedbackProvidedMs
    )

    const consecutiveSwapsCondition = yield* appSelect(hasConsecutiveRecentSwapsSelector)

    // prompt if enough time has passed since last prompt or last feedback provided
    const reminderCondition =
      (appRatingPromptedMs !== undefined &&
        Date.now() - appRatingPromptedMs > MIN_PROMPT_REMINDER_MS) ||
      (appRatingFeedbackProvidedMs !== undefined &&
        Date.now() - appRatingFeedbackProvidedMs > MIN_FEEDBACK_REMINDER_MS)

    const hasNeverPrompted = appRatingPromptedMs === undefined
    const shouldPrompt = consecutiveSwapsCondition && (hasNeverPrompted || reminderCondition)

    if (!shouldPrompt) {
      logger.debug(
        'appRating',
        'maybeRequestAppRating',
        `Skipping app rating (lastPrompt: ${appRatingPromptedMs}, lastProvided: ${appRatingProvidedMs}, consecutiveSwapsCondition: ${consecutiveSwapsCondition})`
      )
      return
    }

    logger.info(
      'appRating',
      'maybeRequestAppRating',
      `Requesting app rating (lastPrompt: ${appRatingPromptedMs}, lastProvided: ${appRatingProvidedMs}, consecutiveSwapsCondition: ${consecutiveSwapsCondition})`
    )

    // Alerts
    const shouldShowNativeReviewModal = yield* call(openRatingOptionsAlert)

    if (shouldShowNativeReviewModal) {
      yield* call(openNativeReviewModal)

      // expo-review does not return whether a rating was actually provided.
      // assume it was and mark rating as provided.
      yield* put(setAppRating({ ratingProvided: true }))

      sendMobileAnalyticsEvent(MobileEventName.AppRating, {
        type: 'store-review',
        appRatingPromptedMs,
        appRatingProvidedMs,
      })
    } else {
      // show feedback form
      const feedbackSent = yield* call(openFeedbackRequestAlert)

      if (feedbackSent) {
        yield* put(setAppRating({ feedbackProvided: true }))

        sendMobileAnalyticsEvent(MobileEventName.AppRating, {
          type: 'feedback-form',
          appRatingPromptedMs,
          appRatingProvidedMs,
        })
      } else {
        yield* put(setAppRating({ feedbackProvided: false }))

        sendMobileAnalyticsEvent(MobileEventName.AppRating, {
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
    Alert.alert(
      'Enjoying Uniswap Wallet?',
      "Let us know if you're having a good experience with this app",
      [
        {
          text: 'Not really',
          onPress: () => resolve(false),
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => {
            openNativeReviewModal().catch((e) =>
              logger.error(e, {
                tags: { file: 'appRating/saga', function: 'openRatingOptionsAlert' },
              })
            )
            resolve(true)
          },
          isPreferred: true,
        },
      ]
    )
  })
}

/** Opens feedback request modal which will redirect to our feedback form. */
async function openFeedbackRequestAlert() {
  return new Promise((resolve) => {
    Alert.alert("We're sorry to hear that.", 'Let us know how we can improve your experience', [
      {
        text: 'Send feedback',
        onPress: () => {
          openUri(APP_FEEDBACK_LINK).catch((e) =>
            logger.error(e, { tags: { file: 'appRating/saga', function: 'openFeedbackAlert' } })
          )
          resolve(true)
        },
        isPreferred: true,
      },
      { text: 'Maybe later', onPress: () => resolve(false), style: 'cancel' },
    ])
  })
}

/** Opens the native store review modal that will send the rating to the store. */
async function openNativeReviewModal() {
  try {
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview()
    }
  } catch (e) {
    logger.error(e, { tags: { file: 'appRating/saga', function: 'useAppRating' } })
  }
}
