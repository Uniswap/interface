import { ChainId } from 'src/constants/chains'

export const migrations = {
  0: (state: any) => {
    const oldTransactionState = state.transactions
    const newTransactionState: any = {}

    const chainIds = Object.keys(oldTransactionState.byChainId)
    for (const chainId of chainIds) {
      const transactions = oldTransactionState.byChainId[chainId]
      const txIds = Object.keys(transactions)
      for (const txId of txIds) {
        const txDetails = transactions[txId]
        const address = txDetails.from
        newTransactionState[address] ??= {}
        newTransactionState[address][chainId] ??= {}
        newTransactionState[address][chainId][txId] = { ...txDetails }
      }
    }

    const oldNotificationState = state.notifications
    const newNotificationState = { ...oldNotificationState, lastTxNotificationUpdate: {} }
    const addresses = Object.keys(oldTransactionState.lastTxHistoryUpdate)
    for (const address of addresses) {
      newNotificationState.lastTxNotificationUpdate[address] = {
        [ChainId.Mainnet]: oldTransactionState.lastTxHistoryUpdate[address],
      }
    }

    return { ...state, transactions: newTransactionState, notifications: newNotificationState }
  },

  1: (state: any) => {
    const newState = { ...state }
    delete newState.walletConnect.modalState
    return newState
  },
}
