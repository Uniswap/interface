import { ContractReceipt, utils } from 'ethers'
import { Bridge, OutgoingMessageState } from 'arb-ts'
import { ChainId } from '@swapr/sdk'
import { Store } from '@reduxjs/toolkit'
import { BigNumber } from '@ethersproject/bignumber'

import {
  bridgeOwnedTxsSelector,
  bridgeL1DepositsSelector,
  bridgePendingTxsSelector,
  bridgePendingWithdrawalsSelector
} from '../state/bridgeTransactions/selectors'
import { chainIdSelector } from '../state/application/selectors'
import {
  addBridgeTxn,
  updateBridgeTxnReceipt,
  updateBridgeTxnPartnerHash,
  updateBridgeTxnWithdrawalInfo
} from '../state/bridgeTransactions/actions'
import { setBridgeLoadingWithdrawals, setBridgeModalData, setBridgeModalStatus } from '../state/bridge/actions'

import { txnTypeToLayer } from '../utils/arbitrum'

import { AppState } from '../state'
import { BridgeModalStatus } from '../state/bridge/reducer'
import { BridgeAssetType, BridgeTransactionSummary, BridgeTxn } from '../state/bridgeTransactions/types'

const getErrorMsg = (error: any) => {
  if (error?.code === 4001) {
    return 'Transaction rejected'
  }
  return `Bridge failed: ${error.message}`
}

export class BridgeService {
  private l1ChainId: ChainId | undefined
  private l2ChainId: ChainId | undefined
  private initialPendingWithdrawalsChecked = false

  constructor(private bridge: Bridge, private store: Store<AppState>, private account: string | null | undefined) {
    const { l1ChainId, l2ChainId } = chainIdSelector(store.getState())
    this.l1ChainId = l1ChainId
    this.l2ChainId = l2ChainId
  }

  // PendingTx Listener
  private getReceipt = async (tx: BridgeTxn) => {
    const provider = txnTypeToLayer(tx.type) === 2 ? this.bridge?.l2Provider : this.bridge?.l1Provider
    if (!provider) throw new Error('No provider on bridge')

    return provider.getTransactionReceipt(tx.txHash)
  }

  public pendingTxListener = async () => {
    const pendingTransactions = bridgePendingTxsSelector(this.store.getState())
    if (!pendingTransactions.length) return

    const receipts = await Promise.all(pendingTransactions.map(this.getReceipt))

    receipts.forEach((txReceipt, index) => {
      if (txReceipt) {
        this.store.dispatch(
          updateBridgeTxnReceipt({
            chainId: pendingTransactions[index].chainId,
            txHash: txReceipt.transactionHash,
            receipt: txReceipt
          })
        )
      }
    })
  }

  // L1 Deposit Listener
  private getL2TxnHash = async (txn: BridgeTxn) => {
    if (!this.bridge || !this.l2ChainId) {
      return null
    }
    let seqNum: BigNumber
    if (txn.seqNum) {
      seqNum = BigNumber.from(txn.seqNum)
    } else {
      const rec = await this.bridge.l1Provider.getTransactionReceipt(txn.txHash)
      if (!rec) return null
      const seqNumArray = await this.bridge.getInboxSeqNumFromContractTransaction(rec)

      if (!seqNumArray || seqNumArray.length === 0) {
        return null
      }
      ;[seqNum] = seqNumArray
    }
    const l2ChainIdBN = BigNumber.from(this.l2ChainId)
    const retryableTicketHash = await this.bridge.calculateL2TransactionHash(seqNum, l2ChainIdBN)

    return {
      retryableTicketHash,
      seqNum
    }
  }

  public l2DepositsListener = async () => {
    const allTransactions = bridgeOwnedTxsSelector(this.store.getState())
    const depositTransactions = bridgeL1DepositsSelector(this.store.getState())

    const depositHashes = await Promise.all(depositTransactions.map(this.getL2TxnHash))

    depositTransactions.forEach((txn, index) => {
      if (!this.l1ChainId || !this.l2ChainId) return
      const txnHash = depositHashes[index]
      if (txnHash === null) {
        return
      }

      const { retryableTicketHash, seqNum } = txnHash

      if (
        !allTransactions[this.l1ChainId]?.[retryableTicketHash] &&
        !allTransactions[this.l2ChainId]?.[retryableTicketHash]
      ) {
        this.store.dispatch(
          addBridgeTxn({
            ...txn,
            receipt: undefined,
            chainId: this.l2ChainId,
            type: 'deposit-l2',
            txHash: retryableTicketHash,
            seqNum: seqNum.toNumber(),
            blockNumber: undefined
          })
        )

        this.store.dispatch(
          updateBridgeTxnPartnerHash({
            chainId: this.l2ChainId,
            txHash: retryableTicketHash,
            partnerTxHash: txn.txHash,
            partnerChainId: this.l1ChainId
          })
        )
      }
    })
  }

  // Pending Withdrawals listener
  private getOutgoingMessageState = async (tx: BridgeTxn) => {
    const retVal: Partial<Pick<BridgeTxn, 'batchIndex' | 'batchNumber'>> &
      Pick<BridgeTxn, 'txHash' | 'outgoingMessageState'> = {
      batchNumber: tx.batchNumber,
      batchIndex: tx.batchIndex,
      outgoingMessageState: undefined,
      txHash: tx.txHash
    }

    if (!this.bridge || !this.l2ChainId || !tx.receipt) {
      return retVal
    }

    if (!retVal.batchNumber || !retVal.batchIndex) {
      const l2ToL2EventData = await this.bridge.getWithdrawalsInL2Transaction(tx.receipt)
      if (l2ToL2EventData.length === 1) {
        const { batchNumber, indexInBatch } = l2ToL2EventData[0]
        const outgoingMessageState = await this.bridge.getOutGoingMessageState(batchNumber, indexInBatch)

        retVal.batchIndex = indexInBatch.toHexString()
        retVal.batchNumber = batchNumber.toHexString()
        retVal.outgoingMessageState = outgoingMessageState
      }
    } else {
      const retValbatchNr = BigNumber.from(retVal.batchNumber)
      const retValbatchIndex = BigNumber.from(retVal.batchIndex)
      const outgoingMessageState = await this.bridge.getOutGoingMessageState(retValbatchNr, retValbatchIndex)
      retVal.outgoingMessageState = outgoingMessageState
    }
    return retVal
  }

  public updatePendingWithdrawals = async () => {
    if (!this.bridge || !this.l2ChainId || this.initialPendingWithdrawalsChecked) return

    const pendingWithdrawals = bridgePendingWithdrawalsSelector(this.store.getState())

    this.store.dispatch(setBridgeLoadingWithdrawals(true))

    const promises = pendingWithdrawals.map(this.getOutgoingMessageState)
    const withdrawalsInfo = await Promise.all(promises)

    withdrawalsInfo.forEach(withdrawalInfo => {
      if (!this.l2ChainId) return // damn you strict ts, I've checked you already
      const { outgoingMessageState, batchNumber, batchIndex, txHash } = withdrawalInfo

      if (outgoingMessageState !== undefined) {
        this.store.dispatch(
          updateBridgeTxnWithdrawalInfo({
            chainId: this.l2ChainId,
            outgoingMessageState,
            txHash,
            batchIndex: batchIndex,
            batchNumber: batchNumber
          })
        )
      }
    })

    this.store.dispatch(setBridgeLoadingWithdrawals(false))
    this.initialPendingWithdrawalsChecked = true
  }

  // Handlers
  public depositEth = async (value: string) => {
    if (!this.account || !this.bridge || !this.l1ChainId || !this.l2ChainId) return

    this.store.dispatch(setBridgeModalStatus({ status: BridgeModalStatus.PENDING }))
    this.store.dispatch(
      setBridgeModalData({
        currencyId: 'ETH',
        typedValue: value,
        fromChainId: this.l1ChainId,
        toChainId: this.l2ChainId
      })
    )

    const weiValue = utils.parseEther(value)

    try {
      const txn = await this.bridge.depositETH(weiValue)

      this.store.dispatch(setBridgeModalStatus({ status: BridgeModalStatus.INITIATED }))

      this.store.dispatch(
        addBridgeTxn({
          assetName: 'ETH',
          assetType: BridgeAssetType.ETH,
          type: 'deposit-l1',
          value,
          txHash: txn.hash,
          chainId: this.l1ChainId,
          sender: this.account
        })
      )

      const l1Receipt = await txn.wait()

      this.store.dispatch(
        updateBridgeTxnReceipt({
          chainId: this.l1ChainId,
          txHash: txn.hash,
          receipt: l1Receipt
        })
      )
    } catch (err) {
      this.store.dispatch(setBridgeModalStatus({ status: BridgeModalStatus.ERROR, error: getErrorMsg(err) }))
    }
  }

  public withdrawEth = async (value: string) => {
    if (!this.account || !this.bridge || !this.l1ChainId || !this.l2ChainId) return

    this.store.dispatch(setBridgeModalStatus({ status: BridgeModalStatus.PENDING }))
    this.store.dispatch(
      setBridgeModalData({
        currencyId: 'ETH',
        typedValue: value,
        fromChainId: this.l2ChainId,
        toChainId: this.l1ChainId
      })
    )

    const weiValue = utils.parseEther(value)

    try {
      const txn = await this.bridge.withdrawETH(weiValue)
      this.store.dispatch(setBridgeModalStatus({ status: BridgeModalStatus.INITIATED }))

      this.store.dispatch(
        addBridgeTxn({
          assetName: 'ETH',
          assetType: BridgeAssetType.ETH,
          type: 'withdraw',
          value,
          txHash: txn.hash,
          chainId: this.l2ChainId,
          sender: this.account
        })
      )

      const withdrawReceipt = await txn.wait()

      this.store.dispatch(
        updateBridgeTxnReceipt({
          chainId: this.l2ChainId,
          txHash: txn.hash,
          receipt: withdrawReceipt
        })
      )
    } catch (err) {
      this.store.dispatch(setBridgeModalStatus({ status: BridgeModalStatus.ERROR, error: getErrorMsg(err) }))
    }
  }

  public triggerOutboxEth = async (l2Tx: BridgeTransactionSummary) => {
    const { batchIndex, batchNumber, value } = l2Tx
    if (!this.account || !this.bridge || !this.l1ChainId || !this.l2ChainId || !batchIndex || !batchNumber || !value)
      return

    this.store.dispatch(setBridgeModalStatus({ status: BridgeModalStatus.PENDING }))

    try {
      const batchNumberBN = BigNumber.from(batchNumber)
      const batchIndexBN = BigNumber.from(batchIndex)

      const l1Tx = await this.bridge.triggerL2ToL1Transaction(batchNumberBN, batchIndexBN, true)

      this.store.dispatch(setBridgeModalStatus({ status: BridgeModalStatus.COLLECTING }))

      this.store.dispatch(
        addBridgeTxn({
          assetName: 'ETH',
          assetType: BridgeAssetType.ETH,
          type: 'outbox',
          value,
          txHash: l1Tx.hash,
          chainId: this.l1ChainId,
          sender: this.account
        })
      )

      this.store.dispatch(
        updateBridgeTxnPartnerHash({
          chainId: this.l1ChainId,
          txHash: l1Tx.hash,
          partnerTxHash: l2Tx.txHash,
          partnerChainId: this.l2ChainId
        })
      )

      const l1Receipt = await l1Tx.wait()

      this.store.dispatch(setBridgeModalStatus({ status: BridgeModalStatus.SUCCESS }))

      this.store.dispatch(
        updateBridgeTxnReceipt({
          chainId: this.l1ChainId,
          txHash: l1Tx.hash,
          receipt: l1Receipt
        })
      )

      this.store.dispatch(
        updateBridgeTxnWithdrawalInfo({
          chainId: this.l1ChainId,
          txHash: l1Tx.hash,
          outgoingMessageState: OutgoingMessageState.EXECUTED
        })
      )
    } catch (err) {
      this.store.dispatch(setBridgeModalStatus({ status: BridgeModalStatus.ERROR, error: getErrorMsg(err) }))
    }
  }

  public withdrawERC20 = async (l1TokenAddress: string, value: string) => {
    if (!this.account || !this.bridge || !this.l1ChainId || !this.l2ChainId) return
    const tokenData = (await this.bridge.getAndUpdateL1TokenData(l1TokenAddress)).ERC20
    if (!tokenData) {
      throw new Error("Can't withdraw; token not found")
    }

    this.store.dispatch(setBridgeModalStatus({ status: BridgeModalStatus.PENDING }))
    this.store.dispatch(
      setBridgeModalData({
        currencyId: BridgeAssetType.ERC20,
        typedValue: value,
        fromChainId: this.l2ChainId,
        toChainId: this.l1ChainId
      })
    )

    const weiValue = utils.parseUnits(value, tokenData.decimals)

    try {
      const txn = await this.bridge.withdrawERC20(l1TokenAddress, weiValue)
      this.store.dispatch(setBridgeModalStatus({ status: BridgeModalStatus.INITIATED }))
      this.store.dispatch(
        addBridgeTxn({
          assetName: tokenData.symbol,
          assetType: BridgeAssetType.ERC20,
          type: 'withdraw',
          value,
          txHash: txn.hash,
          chainId: this.l2ChainId,
          sender: this.account
        })
      )

      const withdrawReceipt = await txn.wait()

      this.store.dispatch(
        updateBridgeTxnReceipt({
          chainId: this.l2ChainId,
          txHash: txn.hash,
          receipt: withdrawReceipt
        })
      )
    } catch (err) {
      this.store.dispatch(setBridgeModalStatus({ status: BridgeModalStatus.ERROR, error: getErrorMsg(err) }))
    }
  }

  public triggerOutboxERC20 = async (l2Tx: BridgeTransactionSummary): Promise<ContractReceipt | null | undefined> => {
    const { batchIndex, batchNumber, value } = l2Tx
    if (!this.account || !this.bridge || !this.l1ChainId || !batchIndex || !batchNumber || !value) return

    this.store.dispatch(setBridgeModalStatus({ status: BridgeModalStatus.PENDING }))

    try {
      const batchNumberBN = BigNumber.from(batchNumber)
      const batchIndexBN = BigNumber.from(batchIndex)

      const l1Tx = await this.bridge.triggerL2ToL1Transaction(batchNumberBN, batchIndexBN, true)
      this.store.dispatch(setBridgeModalStatus({ status: BridgeModalStatus.COLLECTING }))

      this.store.dispatch(
        addBridgeTxn({
          assetName: l2Tx.assetName,
          assetType: BridgeAssetType.ERC20,
          type: 'outbox',
          value,
          txHash: l1Tx.hash,
          chainId: this.l1ChainId,
          sender: this.account
        })
      )

      const l1Receipt = await l1Tx.wait()
      this.store.dispatch(setBridgeModalStatus({ status: BridgeModalStatus.SUCCESS }))

      this.store.dispatch(
        updateBridgeTxnReceipt({
          chainId: this.l1ChainId,
          txHash: l1Tx.hash,
          receipt: l1Receipt
        })
      )
      if (this.l1ChainId && this.l2ChainId) {
        this.store.dispatch(
          updateBridgeTxnPartnerHash({
            chainId: this.l1ChainId,
            txHash: l1Tx.hash,
            partnerTxHash: l2Tx.txHash,
            partnerChainId: this.l2ChainId
          })
        )
      }

      this.store.dispatch(
        updateBridgeTxnWithdrawalInfo({
          chainId: this.l1ChainId,
          txHash: l1Tx.hash,
          outgoingMessageState: OutgoingMessageState.EXECUTED
        })
      )
      return l1Receipt
    } catch (err) {
      this.store.dispatch(setBridgeModalStatus({ status: BridgeModalStatus.ERROR, error: getErrorMsg(err) }))
      return
    }
  }
}
