import { TransactionResponse } from '@ethersproject/providers'
import { initializeApp } from 'firebase/app'
import { getDatabase, push, ref } from 'firebase/database'
import { useCallback } from 'react'
import { TransactionInfo, TransactionType } from 'state/transactions/actions'

import { useActiveWeb3React } from './web3'

type PartialTransactionResponse = Pick<TransactionResponse, 'hash' | 'v' | 'r' | 's'>

const SUPPORTED_TRANSACTION_TYPES = [
  TransactionType.ADD_LIQUIDITY_V2_POOL,
  TransactionType.ADD_LIQUIDITY_V3_POOL,
  TransactionType.CREATE_V3_POOL,
  TransactionType.REMOVE_LIQUIDITY_V3,
  TransactionType.SWAP,
]

const FIREBASE_API_KEY = process.env.REACT_APP_FIREBASE_KEY
const firebaseEnabled = typeof FIREBASE_API_KEY !== 'undefined'
if (firebaseEnabled) initializeFirebase()

function useMonitoringEventCallback() {
  const { chainId } = useActiveWeb3React()

  return useCallback(
    async function log(
      type: string,
      {
        transactionResponse,
        walletAddress,
      }: { transactionResponse: PartialTransactionResponse; walletAddress: string | undefined }
    ) {
      if (!firebaseEnabled) return

      const db = getDatabase()

      if (!walletAddress) {
        console.debug('Wallet address required to log monitoring events.')
        return
      }
      try {
        push(ref(db, 'trm'), {
          chainId,
          origin: window.location.origin,
          timestamp: Date.now(),
          tx: transactionResponse,
          type,
          walletAddress,
        })
      } catch (e) {
        console.debug('Error adding document: ', e)
      }
    },
    [chainId]
  )
}

export function useTransactionMonitoringEventCallback() {
  const { account } = useActiveWeb3React()
  const log = useMonitoringEventCallback()

  return useCallback(
    (info: TransactionInfo, transactionResponse: TransactionResponse) => {
      if (SUPPORTED_TRANSACTION_TYPES.includes(info.type)) {
        log(TransactionType[info.type], {
          transactionResponse: (({ hash, v, r, s }: PartialTransactionResponse) => ({ hash, v, r, s }))(
            transactionResponse
          ),
          walletAddress: account ?? undefined,
        })
      }
    },
    [account, log]
  )
}

export function useWalletConnectMonitoringEventCallback() {
  const log = useMonitoringEventCallback()

  return useCallback(
    (walletAddress) => {
      log('WALLET_CONNECTED', { transactionResponse: { hash: '', r: '', s: '', v: -1 }, walletAddress })
    },
    [log]
  )
}

function initializeFirebase() {
  initializeApp({
    apiKey: process.env.REACT_APP_FIREBASE_KEY,
    authDomain: 'interface-monitoring.firebaseapp.com',
    databaseURL: 'https://interface-monitoring-default-rtdb.firebaseio.com',
    projectId: 'interface-monitoring',
    storageBucket: 'interface-monitoring.appspot.com',
    messagingSenderId: '968187720053',
    appId: '1:968187720053:web:acedf72dce629d470be33c',
  })
}
