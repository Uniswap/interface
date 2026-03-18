import { BigNumber } from '@ethersproject/bignumber'
import { Log, TransactionReceipt } from '@ethersproject/providers'
import { TradingApi } from '@universe/api'
import { getWrappedNativeAddress } from 'uniswap/src/constants/addresses'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import {
  CHAIN_TO_UNIVERSAL_ROUTER_ADDRESS,
  ERC20_TRANSFER_SIGNATURE,
  FLASHBLOCKS_UI_SKIP_ROUTES,
  NATIVE_WITHDRAWAL_SIGNATURE,
} from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/constants'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

/**
 * Works well for ERC20 tokens. Flaky for native tokens; sometimes not logged for swaps
 */
export function getOutputAmountUsingOutputTransferLog({
  outputCurrencyInfo,
  receipt,
  accountAddress,
}: {
  outputCurrencyInfo: CurrencyInfo
  receipt: TransactionReceipt
  accountAddress: string
}): BigNumber {
  const chainId = outputCurrencyInfo.currency.chainId

  const outputTokenAddress = normalizeTokenAddressForCache(
    outputCurrencyInfo.currency.isToken ? outputCurrencyInfo.currency.address : getWrappedNativeAddress(chainId),
  )

  // calculate output amount from transaction logs
  let outputAmount = BigNumber.from(0)

  const isErc20TransferLog = (log: Log): boolean => {
    return !!(
      log.topics[0]?.toLowerCase() === ERC20_TRANSFER_SIGNATURE &&
      normalizeTokenAddressForCache(log.address) === outputTokenAddress &&
      log.topics[2]?.toLowerCase().endsWith(normalizeTokenAddressForCache(accountAddress).slice(2))
    )
  }

  const isNativeTransferLog = (log: Log): boolean => {
    return !!(
      log.topics[0]?.toLowerCase() === NATIVE_WITHDRAWAL_SIGNATURE &&
      normalizeTokenAddressForCache(log.address) === outputTokenAddress &&
      isUniverseChainId(chainId) &&
      CHAIN_TO_UNIVERSAL_ROUTER_ADDRESS[chainId]?.some((routerAddress) =>
        log.topics[1]?.toLowerCase().endsWith(routerAddress.slice(2)),
      )
    )
  }

  receipt.logs.forEach((log: Log) => {
    if (outputCurrencyInfo.currency.isToken ? isErc20TransferLog(log) : isNativeTransferLog(log)) {
      // log.data is value
      try {
        outputAmount = outputAmount.add(BigNumber.from(log.data))
      } catch (_e) {
        // skip logs that can't be parsed
      }
    }
  })

  return outputAmount
}

/**
 * Checks if a routing type should show flashblocks UI treatment
 * @param routing - The routing type to check
 * @returns true if the routing should show flashblocks UI
 */
export function shouldShowFlashblocksUI(routing?: TradingApi.Routing): boolean {
  return routing ? !FLASHBLOCKS_UI_SKIP_ROUTES.includes(routing) : false
}

/**
 *
 * This is used to skip flashblock transaction treatments for non-swapish types.
 *
 * @param param0 transaction
 * @returns true if the transaction is a non-instant flashblock type; false otherwise
 */
export function isNonInstantFlashblockTransactionType({ typeInfo, routing }: TransactionDetails): boolean {
  // TODO: APPS(8557): wraps are labeled classic in tx flow; remove when fixed
  const trueRoute = typeInfo.type === TransactionType.Wrap ? TradingApi.Routing.WRAP : routing

  return FLASHBLOCKS_UI_SKIP_ROUTES.includes(trueRoute)
}
