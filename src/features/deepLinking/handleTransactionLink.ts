import { navigate } from 'src/app/navigation/rootNavigation'
import { Screens } from 'src/screens/Screens'
import { logger } from 'src/utils/logger'
import { call } from 'typed-redux-saga'

export function* handleTransactionLink(url: URL) {
  try {
    const txHash = url.searchParams.get('txHash')
    if (!txHash) throw new Error('No `txHash` provided')
    // TODO: validate the txHash exists in the user's tx history
    // and navigate to the specific tx detail screen when it's created
    yield* call(navigate, Screens.Activity)
  } catch (error: any) {
    logger.info('handleTransactionLink', 'handleTransactionLink', error?.message)
    yield* call(navigate, Screens.Activity)
  }
}
