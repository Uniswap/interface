import { CeloContract } from '@celo/contractkit'
import { currencyEquals } from '@ubeswap/sdk'
import { ContractTransaction } from 'ethers'
import { AToken__factory } from 'generated/factories/AToken__factory'

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
  const CELO = chainCfg[CeloContract.GoldToken]

  const pool = LendingPool__factory.connect(chainCfg.lendingPool, signer)

  const { inputAmount } = trade
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
      const aToken = AToken__factory.connect(inputAmount.token.address, signer)
      return await doTransaction(aToken, 'redeem', {
        args: [inputAmount.raw.toString()],
        summary: `Withdraw ${inputAmount.toSignificant(2)} ${symbol} from Moola`,
      })
    }
    if (currencyEquals(token, CELO)) {
      return await doTransaction(pool, 'deposit', {
        args: ['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', inputAmount.raw.toString(), 0x0421],
        overrides: {
          value: inputAmount.raw.toString(),
        },
        summary: `Deposit ${inputAmount.toSignificant(2)} ${symbol} into Moola`,
      })
    }
    if (symbol) {
      return await doTransaction(pool, 'deposit', {
        args: [inputAmount.token.address, inputAmount.raw.toString(), 0x0421],
        summary: `Deposit ${inputAmount.toSignificant(2)} ${symbol} into Moola`,
      })
    }
    throw new Error(`unknown currency: ${token.address}`)
  }

  return { hash: (await convert()).hash }
}
