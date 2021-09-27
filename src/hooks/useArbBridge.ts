import { Bridge, OutgoingMessageState, networks } from 'arb-ts'
import { useDispatch } from 'react-redux'
import { useCallback, useEffect, useState } from 'react'
import { providers, Signer, utils } from 'ethers'

import { useActiveWeb3React } from '.'

import { NETWORK_DETAIL } from '../constants'
import { INFURA_PROJECT_ID } from '../connectors'
import { addBridgeTxn, updateBridgeTxnReceipt, updateBridgeTxnL2Hash } from '../state/bridgeTransactions/actions'
import { BridgeAssetType } from '../state/bridgeTransactions/types'

const wait = (ms = 0) => {
  return new Promise(res => setTimeout(res, ms || 10000))
}

const addInfuraKey = (rpcUrl: string) => {
  if (rpcUrl.includes('infura')) {
    let updatedUrl = rpcUrl

    if (!rpcUrl.endsWith('/')) {
      updatedUrl = rpcUrl + '/'
    }

    return updatedUrl + INFURA_PROJECT_ID
  }

  return rpcUrl
}

export const useArbBridge = () => {
  const { library, chainId, account } = useActiveWeb3React()
  const [bridge, setBridge] = useState<Bridge | null>(null)
  const dispatch = useDispatch()

  useEffect(() => {
    const initBridge = async (
      ethSigner: Signer,
      arbSigner: Signer,
      l1GatewayRouterAddress?: string | undefined,
      l2GatewayRouterAddress?: string | undefined
    ) => {
      const bridge = await Bridge.init(ethSigner, arbSigner, l1GatewayRouterAddress, l2GatewayRouterAddress)
      setBridge(bridge)
    }

    // Setting the bridge
    if (library && account && chainId) {
      const { partnerChainId, isArbitrum } = NETWORK_DETAIL[chainId]
      let l1Signer: providers.JsonRpcSigner, l2Signer: providers.JsonRpcSigner

      // Has arbitrum support
      if (partnerChainId) {
        // Withdraw
        if (isArbitrum) {
          const rpcUrl = NETWORK_DETAIL[partnerChainId].rpcUrls[0]
          console.log('Withdraw mode')
          l1Signer = new providers.JsonRpcProvider(addInfuraKey(rpcUrl)).getSigner(account)
          l2Signer = library.getSigner()
          // Deposit
        } else {
          console.log('Deposit mode')
          l1Signer = library.getSigner()
          l2Signer = new providers.JsonRpcProvider(NETWORK_DETAIL[partnerChainId].rpcUrls[0]).getSigner(account)
        }

        if (l1Signer && l2Signer) {
          initBridge(l1Signer, l2Signer, networks[chainId].tokenBridge.l1GatewayRouter, networks[chainId].tokenBridge.l2GatewayRouter)
        }
      }
    }
  }, [chainId, library, account])

  // Methods

  const depositEth = useCallback(
    async (value: string) => {
      if (!bridge || !chainId || !account) return
      const { partnerChainId } = NETWORK_DETAIL[chainId]

      if (!partnerChainId) return
      const weiValue = utils.parseEther(value)

      try {
        // L1
        const txn = await bridge.depositETH(weiValue)
        console.log('dispacz addBridgeTxn')
        dispatch(
          addBridgeTxn({
            assetName: 'ETH',
            assetType: BridgeAssetType.ETH,
            type: 'deposit-l1',
            value,
            txHash: txn.hash,
            status: 'l1-pending',
            from: chainId,
            to: partnerChainId,
            sender: account
          })
        )

        const l1Receipt = await txn.wait()
        console.log('dispacz updateBridgeTxnReceipt')
        dispatch(
          updateBridgeTxnReceipt({
            chainId,
            txHash: txn.hash,
            layer: 1,
            receipt: l1Receipt
          })
        )
        //updateEthBalance
        const seqNum = await bridge.getInboxSeqNumFromContractTransaction(l1Receipt)
        if (!seqNum) return

        const l2TxnHash = await bridge.calculateL2TransactionHash(seqNum[0])
        console.log('dispacz updateBridgeTxnL2Hash', l2TxnHash)
        dispatch(
          updateBridgeTxnL2Hash({
            chainId,
            txHash: txn.hash,
            l2Hash: l2TxnHash
          })
        )

        // L2
        const l2Receipt = await bridge.l2Bridge.l2Provider.waitForTransaction(l2TxnHash, undefined, 1000 * 60 * 15)
        console.log('dispacz updateBridgeTxnReceipt')

        dispatch(
          updateBridgeTxnReceipt({
            chainId,
            txHash: txn.hash,
            layer: 2,
            receipt: l2Receipt
          })
        )
        // update balance
      } catch (err) {
        throw err
      }
    },
    [account, bridge, chainId, dispatch]
  )

const withdrawEth = useCallback(
  async (value: string) => {
    if (!bridge || !chainId || !account) return
    const { partnerChainId } = NETWORK_DETAIL[chainId]

    if (!partnerChainId) return
    const weiValue = utils.parseEther(value)

    try {
      // L2
      const withdrawTx = await bridge.withdrawETH(weiValue)
      console.log('Call withdrawETH', withdrawTx)
      console.log('Withdraw hash', withdrawTx.hash)
      dispatch(
        addBridgeTxn({
          assetName: 'ETH',
          assetType: BridgeAssetType.ETH,
          type: 'withdraw',
          value,
          txHash: withdrawTx.hash,
          status: 'l1-pending',
          from: chainId,
          to: partnerChainId,
          sender: account
        })
      )

      const withdrawReceipt = await withdrawTx.wait()
      console.log('Get withdraw receipt', withdrawReceipt)
      dispatch(
        updateBridgeTxnReceipt({
          chainId,
          txHash: withdrawTx.hash,
          layer: 2,
          receipt: withdrawReceipt
        })
      )
      
      //withdrawal event
      const l2ToL2EventData = await bridge.getWithdrawalsInL2Transaction(withdrawReceipt)
      console.log("Call getWithdrawalsInL2Transaction and get event data")
      // if (l2ToL2EventData.length === 0)
      // throw new Error(`Txn ${withdrawTx} did not initiate an outgoing messages`)
      console.log('Event data length:',l2ToL2EventData.length)
      if (l2ToL2EventData.length === 1) {
        const { batchNumber, indexInBatch } = l2ToL2EventData[0]

        let outgoingMessageState = await bridge.getOutGoingMessageState(
          batchNumber,
          indexInBatch
        )
        console.log('Call getOutGoingMessageState ', outgoingMessageState)
        console.log(
          `Waiting for message to be confirmed: Batchnumber: ${batchNumber}, IndexInBatch ${indexInBatch}`
        )
        
        while (outgoingMessageState !== OutgoingMessageState.CONFIRMED) {
          await wait(1000 * 5)
          outgoingMessageState = await bridge.getOutGoingMessageState(
            batchNumber,
            indexInBatch
          )
          console.log('Updated outgoing message state', outgoingMessageState)

          switch (outgoingMessageState) {
            case OutgoingMessageState.NOT_FOUND: {
              console.log('Message not found; something strange and bad happened')
              break
            }
            case OutgoingMessageState.EXECUTED: {
              console.log(`Message already executed! Nothing else to do here`)
              break
            }
            case OutgoingMessageState.UNCONFIRMED: {
              console.log(`Message not yet confirmed; we'll wait a bit and try again`)
              break
            }
      
            default:
              break
          }
        }
        console.log('Outgoing message state after waiting for confirmation:', outgoingMessageState)
        
        /**
         * Now that its confirmed, we can retrieve the Merkle proof data from the chain, and execute our message in its outbox entry.
         * triggerL2ToL1Transaction handles these steps
         */
        const res = await bridge.triggerL2ToL1Transaction(batchNumber, indexInBatch)
        console.log('Transaction triggered. Waiting.')
        const rec = await res.wait()
      
        console.log('Done! Your transaction is executed')
        console.log(rec)  
      }
      return withdrawReceipt
    } catch (err) {
      throw err
    }
  },
  [account, bridge, chainId, dispatch]
)










  return {
    depositEth,
    withdrawEth
  }
}
