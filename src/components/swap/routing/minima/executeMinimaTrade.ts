import { ContractTransaction } from 'ethers'

import { MINIMA_ROUTER_ADDRESS } from '../../../../constants'
import { MinimaRouter__factory } from '../../../../generated'
import { TradeExecutor } from '..'
import { MinimaRouterTrade } from '../trade'

/**
 * Executes a trade on Minima.
 * @param trade
 * @returns
 */
export const executeMinimaTrade: TradeExecutor<MinimaRouterTrade> = async ({
  trade,
  signer,
  doTransaction,
  recipient,
  withRecipient,
}) => {
  const contract = MinimaRouter__factory.connect(MINIMA_ROUTER_ADDRESS, signer)

  const { details, inputAmount, outputAmount } = trade
  const inputToken = inputAmount.token
  const outputToken = outputAmount.token

  const convert = async (): Promise<ContractTransaction> => {
    const inputSymbol = inputToken.symbol ?? null
    const outputSymbol = outputToken.symbol ?? null

    const tokenAmountIn = inputAmount.toSignificant(3)
    const tokenAmountOut = outputAmount.toSignificant(3)

    await contract.callStatic
      .swapExactInputForOutput({ ...details, to: recipient ?? '' })
      .then((data) => {
        console.log(data)
      })
      .catch((err) => {
        console.log(err)
      })
    return await doTransaction(contract, 'swapExactInputForOutput', {
      args: [{ ...details, to: recipient ?? '' }],
      summary: `Swap ${tokenAmountIn} ${inputSymbol} for ${tokenAmountOut} ${outputSymbol}${withRecipient}`,
      raw: trade?.txn,
    })
  }

  return { hash: (await convert()).hash }
}
