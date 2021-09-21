import { Bridge } from 'arb-ts'
import { useDispatch } from 'react-redux'
import { useCallback, useEffect, useState } from 'react'
import { providers, Signer, utils } from 'ethers'

import { useActiveWeb3React } from '.'

import { NETWORK_DETAIL } from '../constants'
import { INFURA_PROJECT_ID } from '../connectors'
import { addBridgeTxn, updateBridgeTxnReceipt, updateBridgeTxnL2Hash } from '../state/bridgeTransactions/actions'
import { BridgeAssetType } from '../state/bridgeTransactions/types'

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
          initBridge(l1Signer, l2Signer)
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

  return {
    depositEth
  }
}
