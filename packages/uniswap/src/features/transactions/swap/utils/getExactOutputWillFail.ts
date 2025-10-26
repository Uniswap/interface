import { Token } from '@uniswap/sdk-core'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { CurrencyField } from 'uniswap/src/types/currency'

function getHasTokenFee(currencyInfo: Maybe<CurrencyInfo>): {
  hasBuyTax: boolean
  hasSellTax: boolean
} {
  if (!(currencyInfo?.currency instanceof Token)) {
    return { hasBuyTax: false, hasSellTax: false }
  }

  return {
    hasBuyTax: !!currencyInfo.currency.buyFeeBps && currencyInfo.currency.buyFeeBps.gt(0),
    hasSellTax: !!currencyInfo.currency.sellFeeBps && currencyInfo.currency.sellFeeBps.gt(0),
  }
}

export function getExactOutputWillFail({
  currencies,
}: {
  currencies: {
    input: Maybe<CurrencyInfo>
    output: Maybe<CurrencyInfo>
  }
}): {
  outputTokenHasBuyTax: boolean
  exactOutputWillFail: boolean
  exactOutputWouldFailIfCurrenciesSwitched: boolean
} {
  const { hasBuyTax: inputTokenHasBuyTax, hasSellTax: inputTokenHasSellTax } = getHasTokenFee(
    currencies[CurrencyField.INPUT],
  )
  const { hasBuyTax: outputTokenHasBuyTax, hasSellTax: outputTokenHasSellTax } = getHasTokenFee(
    currencies[CurrencyField.OUTPUT],
  )

  // Check if either currency is a Solana token
  const inputChainId = toSupportedChainId(currencies[CurrencyField.INPUT]?.currency.chainId)
  const outputChainId = toSupportedChainId(currencies[CurrencyField.OUTPUT]?.currency.chainId)
  const hasSolanaToken =
    Boolean(inputChainId && isSVMChain(inputChainId)) || Boolean(outputChainId && isSVMChain(outputChainId))

  // Disable exact output for:
  // 1. FOT tokens (fee-on-transfer)
  // 2. Solana tokens (Jupiter doesn't support exact output)
  const exactOutputWillFail = inputTokenHasSellTax || outputTokenHasBuyTax || hasSolanaToken
  const exactOutputWouldFailIfCurrenciesSwitched = inputTokenHasBuyTax || outputTokenHasSellTax || hasSolanaToken

  return {
    outputTokenHasBuyTax,
    exactOutputWillFail,
    exactOutputWouldFailIfCurrenciesSwitched,
  }
}
