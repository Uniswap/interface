import { useConnectedSigner } from '@celo/react-celo'
import { JsonRpcSigner } from '@ethersproject/providers'
import { ChainId, TokenAmount } from '@ubeswap/sdk'
import { LimitOrderProtocol__factory } from 'generated/factories/LimitOrderProtocol__factory'
import { OrderBook__factory } from 'generated/factories/OrderBook__factory'
import { useCallback, useState } from 'react'
import { buildOrderData } from 'utils/limitOrder'

import {
  LIMIT_ORDER_ADDRESS,
  ORDER_BOOK_ADDRESS,
  ORDER_BOOK_REWARD_DISTRIBUTOR_ADDRESS,
  ZERO_ADDRESS,
} from '../../../../constants'
import { useDoTransaction } from '..'

function cutLastArg(data: string, padding = 0) {
  return data.substr(0, data.length - 64 - padding)
}

/**
 * Queues a limit order trade.
 * @returns
 */
export const useQueueLimitOrderTrade = () => {
  const signer = useConnectedSigner() as JsonRpcSigner
  const doTransaction = useDoTransaction()
  const [loading, setLoading] = useState(false)
  const queueLimitOrderCallback = useCallback(
    async ({
      inputAmount,
      outputAmount,
      chainId,
    }: {
      inputAmount: TokenAmount
      outputAmount: TokenAmount
      chainId: ChainId
    }) => {
      const limitOrderAddr = LIMIT_ORDER_ADDRESS[chainId]
      const orderBookAddr = ORDER_BOOK_ADDRESS[chainId]
      const rewardDistributorAddr = ORDER_BOOK_REWARD_DISTRIBUTOR_ADDRESS[chainId]

      const limitOrderProtocolIface = LimitOrderProtocol__factory.createInterface()
      const orderBook = OrderBook__factory.connect(orderBookAddr, signer)

      const makingAmount = inputAmount.raw.toString()
      const takingAmount = outputAmount.raw.toString()

      const limitOrder = {
        salt: Math.floor(Math.random() * 1_000_000_000), // Reasonably random
        makerAsset: inputAmount.currency.address,
        takerAsset: outputAmount.currency.address,
        maker: await signer.getAddress(),
        receiver: ZERO_ADDRESS,
        allowedSender: ZERO_ADDRESS,
        makingAmount,
        takingAmount,
        makerAssetData: '0x',
        takerAssetData: '0x',
        getMakerAmount: cutLastArg(
          limitOrderProtocolIface.encodeFunctionData('getMakerAmount', [makingAmount, takingAmount, 0])
        ),
        getTakerAmount: cutLastArg(
          limitOrderProtocolIface.encodeFunctionData('getTakerAmount', [makingAmount, takingAmount, 0])
        ),
        predicate: '0x',
        permit: '0x',
        interaction: '0x',
      }
      try {
        setLoading(true)
        const limitOrderTypedData = buildOrderData(chainId.toString(), limitOrderAddr, limitOrder)
        const limitOrderSignature = await signer._signTypedData(
          limitOrderTypedData.domain,
          limitOrderTypedData.types,
          limitOrder
        )
        await doTransaction(orderBook, 'broadcastOrder', {
          args: [limitOrder, limitOrderSignature, rewardDistributorAddr],
          summary: `Place limit order for ${outputAmount.toSignificant(2)} ${outputAmount.currency.symbol}`,
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    },
    [doTransaction, signer]
  )
  return { queueLimitOrderCallback, loading }
}
