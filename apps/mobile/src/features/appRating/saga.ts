import * as StoreReview from 'expo-store-review'
import { Alert } from 'react-native'
import { APP_FEEDBACK_LINK } from 'src/constants/urls'
import { openUri } from 'src/utils/linking'
import { call, delay, put, select, takeLatest } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { selectSwapTransactionsCount } from 'wallet/src/features/transactions/selectors'
import { finalizeTransaction } from 'wallet/src/features/transactions/slice'
import { TransactionStatus, TransactionType } from 'wallet/src/features/transactions/types'
import { selectActiveAccount } from 'wallet/src/features/wallet/selectors'
import { setAppRating } from 'wallet/src/features/wallet/slice'
import { appSelect } from 'wallet/src/state'

// at most once per reminder period
const MIN_PROMPT_REMINDER_MS = 30 * ONE_SECOND_MS
// small delay to help ux
const SWAP_FINALIZED_PROMPT_DELAY_MS = 1 * ONE_SECOND_MS

export function* appRatingWatcherSaga() {
  function* processFinalizedTx(action: ReturnType<typeof finalizeTransaction>) {
    // count successful swaps
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
    const activeAccount = yield* select(selectActiveAccount)
    const activeAddress = activeAccount?.address
    if (!activeAddress) return

    // Conditions
    const appRatingProvidedMs = yield* appSelect((state) => state.wallet.appRatingProvidedMs)
    if (appRatingProvidedMs) return // avoids prompting again

    const appRatingPromptedMs = yield* appSelect((state) => state.wallet.appRatingPromptedMs)
    const numSwapsCompleted = yield* appSelect(selectSwapTransactionsCount)

    // prompt at most every other swap
    const transactionCountCondition = numSwapsCompleted % 2 === 0
    // prompt if never prompted, or reminder delay has elapsed
    const reminderCondition =
      !appRatingPromptedMs || Date.now() - appRatingPromptedMs > MIN_PROMPT_REMINDER_MS

    const shouldPrompt = transactionCountCondition && reminderCondition

    if (!shouldPrompt) {
      logger.debug(
        'appRating',
        'maybeRequestAppRating',
        `Skipping app rating (lastPrompt: ${appRatingPromptedMs}, lastProvided: ${appRatingProvidedMs}, tx completed: ${numSwapsCompleted})`
      )
      return
    }

    logger.info(
      'appRating',
      'maybeRequestAppRating',
      `Requesting app rating (lastPrompt: ${appRatingPromptedMs}, lastProvided: ${appRatingProvidedMs}, tx completed: ${numSwapsCompleted})`
    )

    // Alerts
    const shouldShowNativeReviewModal = yield* call(openRatingOptionsAlert)

    if (shouldShowNativeReviewModal) {
      yield* call(openNativeReviewModal)

      // expo-review does not return whether a rating was actually provided.
      // assume it was and mark rating as provided.
      yield* put(setAppRating({ remindLater: false }))
    } else {
      // show feedback form
      const feedbackSent = yield* call(openFeedbackRequestAlert)

      if (feedbackSent) {
        yield* put(setAppRating({ remindLater: false }))
      } else {
        yield* put(setAppRating({ remindLater: true }))
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
