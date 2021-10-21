import { CeloContract } from '@celo/contractkit'
import { currencyEquals } from '@ubeswap/sdk'
import { ContractTransaction } from 'ethers'

import { LendingPool__factory } from '../../../../generated'
import { TradeExecutor } from '..'
import { MoolaDirectTrade } from './MoolaDirectTrade'
import { moolaLendingPools } from './useMoola'

/**
 * Executes a trade on Moola.
 * @param trade
 * @returns
 */
export const executeMoolaDirectTrade: TradeExecutor<MoolaDirectTrade> = async ({
  trade,
  signer,
  chainId,
  doTransaction,
}) => {
  const chainCfg = moolaLendingPools[chainId]
  const { mcUSD, mCELO } = chainCfg

  const pool = LendingPool__factory.connect(chainCfg.lendingPool, signer)

  const { inputAmount, outputAmount } = trade
  const token = inputAmount.token

  const convert = async (): Promise<ContractTransaction> => {
    const symbol = currencyEquals(token, chainCfg[CeloContract.StableToken])
      ? 'cUSD'
      : currencyEquals(token, chainCfg[CeloContract.GoldToken])
      ? 'CELO'
      : currencyEquals(token, mcUSD)
      ? 'mcUSD'
      : currencyEquals(token, mCELO)
      ? 'mCELO'
      : token.symbol ?? null

    if (symbol?.startsWith('m')) {
      const recipient = await signer.getAddress()
      return await doTransaction(pool, 'withdraw', {
        args: [outputAmount.token.address, outputAmount.raw.toString(), recipient],
        summary: `Withdraw ${inputAmount.toSignificant(2)} ${symbol} from Moola`,
      })
    }
    if (symbol) {
      const recipient = await signer.getAddress()
      return await doTransaction(pool, 'deposit', {
        args: [inputAmount.token.address, inputAmount.raw.toString(), recipient, 0x0421],
        summary: `Deposit ${inputAmount.toSignificant(2)} ${symbol} into Moola`,
      })
    }
    throw new Error(`unknown currency: ${token.address}`)
  }

  return { hash: (await convert()).hash }
}
