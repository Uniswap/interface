import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { DynamicConfigs, SwapConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'

const NATIVE_CURRENCY_DECIMAL = 18
const NATIVE_CURRENCY_DECIMAL_OFFSET = NATIVE_CURRENCY_DECIMAL - 4

/**
 * Given some token amount, return the max that can be spent of it
 * @param currencyAmount to return max of
 * @param transactionType to determine cost of transaction
 */
export function useMaxAmountSpend(
  currencyAmount: Maybe<CurrencyAmount<Currency>>,
  txType?: TransactionType,
): Maybe<CurrencyAmount<Currency>> {
  const minAmount = useGetMinAmount(currencyAmount?.currency.chainId, txType)

  if (!currencyAmount || !minAmount) {
    return undefined
  }
  if (!currencyAmount.currency.isNative) {
    return currencyAmount
  }

  // If amount is negative then set it to 0
  const amount = JSBI.greaterThan(currencyAmount.quotient, minAmount)
    ? JSBI.subtract(currencyAmount.quotient, minAmount).toString()
    : '0'

  return getCurrencyAmount({
    value: amount,
    valueType: ValueType.Raw,
    currency: currencyAmount.currency,
  })
}

function useGetMinAmount(chainId?: UniverseChainId, txType?: TransactionType): JSBI | undefined {
  const MIN_ETH_FOR_GAS = useMinEthForGas(txType)
  const MIN_POLYGON_FOR_GAS = useMinPolygonForGas(txType)
  const MIN_AVALANCHE_FOR_GAS = useMinAvalancheForGas(txType)
  const MIN_CELO_FOR_GAS = useMinCeloForGas(txType)
  const MIN_L2_FOR_GAS = useMinGenericL2ForGas(txType)

  if (!chainId) {
    return undefined
  }

  switch (chainId) {
    case UniverseChainId.Mainnet:
      return MIN_ETH_FOR_GAS
    case UniverseChainId.Sepolia:
      return MIN_ETH_FOR_GAS
    case UniverseChainId.Polygon:
      return MIN_POLYGON_FOR_GAS
    case UniverseChainId.Avalanche:
      return MIN_AVALANCHE_FOR_GAS
    case UniverseChainId.Celo:
      return MIN_CELO_FOR_GAS
    case UniverseChainId.ArbitrumOne:
    case UniverseChainId.Optimism:
    case UniverseChainId.Base:
    case UniverseChainId.Bnb:
    case UniverseChainId.Blast:
    case UniverseChainId.WorldChain:
    case UniverseChainId.Zora:
    case UniverseChainId.Zksync:
    case UniverseChainId.AstrochainSepolia:
      return MIN_L2_FOR_GAS
    default:
      logger.error(new Error('unhandled chain when getting min gas amount'), {
        tags: {
          file: 'useMaxAmountSpend.ts',
          function: 'getMinAmount',
        },
      })
      return MIN_L2_FOR_GAS
  }
}

export function useMinEthForGas(txType?: TransactionType): JSBI {
  return useCalculateMinForGas(
    isSend(txType) ? SwapConfigKey.EthSendMinGasAmount : SwapConfigKey.EthSwapMinGasAmount,
    isSend(txType) ? 150 : 20, // .015 and .002 ETH
  )
}

export function useMinPolygonForGas(txType?: TransactionType): JSBI {
  return useCalculateMinForGas(
    isSend(txType) ? SwapConfigKey.PolygonSendMinGasAmount : SwapConfigKey.PolygonSwapMinGasAmount,
    isSend(txType) ? 600 : 75, // .06 and .0075 MATIC
  )
}

export function useMinAvalancheForGas(txType?: TransactionType): JSBI {
  return useCalculateMinForGas(
    isSend(txType) ? SwapConfigKey.AvalancheSendMinGasAmount : SwapConfigKey.AvalancheSwapMinGasAmount,
    isSend(txType) ? 200 : 25, // .02 and .0025 AVAX
  )
}

export function useMinCeloForGas(txType?: TransactionType): JSBI {
  return useCalculateMinForGas(
    isSend(txType) ? SwapConfigKey.CeloSendMinGasAmount : SwapConfigKey.CeloSwapMinGasAmount,
    isSend(txType) ? 100 : 13, // .01 and .0013 CELO
  )
}

export function useMinGenericL2ForGas(txType?: TransactionType): JSBI {
  return useCalculateMinForGas(
    isSend(txType) ? SwapConfigKey.GenericL2SendMinGasAmount : SwapConfigKey.GenericL2SwapMinGasAmount,
    isSend(txType) ? 8 : 1, // .0008 and .0001 ETH
  )
}

export function useCalculateMinForGas(amount: SwapConfigKey, defaultAmount: number): JSBI {
  const multiplier = useDynamicConfigValue(DynamicConfigs.Swap, amount, defaultAmount)

  return JSBI.multiply(
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(NATIVE_CURRENCY_DECIMAL_OFFSET)),
    JSBI.BigInt(multiplier),
  )
}

function isSend(transactionType?: TransactionType): boolean {
  return transactionType === TransactionType.Send
}
