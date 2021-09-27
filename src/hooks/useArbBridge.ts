import { useDispatch } from 'react-redux'
import { useCallback, useContext } from 'react'
import { utils } from 'ethers'

import { useActiveWeb3React } from '.'

import { BridgeContext } from '../contexts/BridgeProvider'
import { BridgeAssetType } from '../state/bridgeTransactions/types'
import { addBridgeTxn, updateBridgeTxnReceipt } from '../state/bridgeTransactions/actions'

export const useBridge = () => {
  return useContext(BridgeContext)
}

export const useArbBridge = () => {
  const {
    bridge,
    chainIdPair: { l1ChainId, l2ChainId }
  } = useBridge()
  const dispatch = useDispatch()
  const { account } = useActiveWeb3React()

  const depositEth = useCallback(
    async (value: string) => {
      if (!account || !bridge || !l1ChainId || !l2ChainId) return

      const weiValue = utils.parseEther(value)

      try {
        // L1
        const txn = await bridge.depositETH(weiValue)

        dispatch(
          addBridgeTxn({
            assetName: 'ETH',
            assetType: BridgeAssetType.ETH,
            type: 'deposit-l1',
            value,
            txHash: txn.hash,
            chainId: l1ChainId,
            sender: account
          })
        )

        const l1Receipt = await txn.wait()

        dispatch(
          updateBridgeTxnReceipt({
            chainId: l1ChainId,
            txHash: txn.hash,
            receipt: l1Receipt
          })
        )
        // const seqNum = await bridge.getInboxSeqNumFromContractTransaction(l1Receipt)
        // if (!seqNum) return

        // const l2TxnHash = await bridge.calculateL2TransactionHash(seqNum[0])

        // dispatch(
        //   addBridgeTxn({
        //     assetName: 'ETH',
        //     assetType: BridgeAssetType.ETH,
        //     type: 'deposit-l2',
        //     value,
        //     txHash: l2TxnHash,
        //     chainId: l2ChainId,
        //     sender: account,
        //     seqNum: seqNum[0].toNumber()
        //   })
        // )

        // // L2
        // const l2Receipt = await bridge.l2Bridge.l2Provider.waitForTransaction(l2TxnHash, undefined, 1000 * 60 * 15)
        // dispatch(
        //   updateBridgeTxnReceipt({
        //     chainId: l2ChainId,
        //     txHash: l2TxnHash,
        //     receipt: l2Receipt
        //   })
        // )
        // dispatch(
        //   updateBridgeTxnPartnerHash({
        //     chainId: l1ChainId,
        //     txHash: txn.hash,
        //     partnerTxHash: l2TxnHash,
        //     partnerChainId: l2ChainId
        //   })
        // )
        // // update balance
      } catch (err) {
        throw err
      }
    },
    [account, bridge, dispatch, l1ChainId, l2ChainId]
  )

  return {
    depositEth
  }
}
