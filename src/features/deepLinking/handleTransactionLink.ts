import { navigate } from 'src/app/navigation/rootNavigation'
import { Screens } from 'src/screens/Screens'
import { logger } from 'src/utils/logger'
import { call } from 'typed-redux-saga'

export function* handleTransactionLink(url: URL) {
  try {
    const txHash = url.searchParams.get('txHash')
    // TODO: validate the txHash exists in the user's tx history
    if (!txHash) throw new Error('No `txHash` provided')
    yield* call(navigate, Screens.Notifications, { txHash })
  } catch (error: any) {
    logger.info('handleTransactionLink', 'handleTransactionLink', error?.message)
    yield* call(navigate, Screens.Notifications)
  }
}
