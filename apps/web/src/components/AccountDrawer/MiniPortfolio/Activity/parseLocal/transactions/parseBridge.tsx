import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { fetchCurrency } from 'uniswap/src/features/tokens/fetchCurrencyInfo'
import type { BridgeTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import type { FormatNumberFunctionType } from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/types'
import type { Activity } from '~/components/AccountDrawer/MiniPortfolio/Activity/types'

// Typography = the legacy `variant: 'body2'` preset, inlined.
const StyledBridgeAmountText = styled(Text, {
  base: '[font-family:var(--stext-font-book)] text-[16px] [line-height:20.8px] [font-weight:485] whitespace-nowrap text-ellipsis overflow-hidden',
})

export function getBridgeDescriptor({
  tokenIn,
  inputAmount,
  tokenOut,
  outputAmount,
}: {
  tokenIn?: Currency
  outputAmount: string
  tokenOut?: Currency
  inputAmount: string
}) {
  const inputChain = tokenIn?.chainId ?? null
  const outputChain = tokenOut?.chainId ?? null
  return (
    <Flex row alignItems="center" gap="4px">
      <NetworkLogo chainId={inputChain} size={16} borderRadius={6} />
      <StyledBridgeAmountText>
        {inputAmount}&nbsp;{tokenIn?.symbol ?? i18n.t('common.unknown')}
      </StyledBridgeAmountText>
      <Arrow direction="e" color="$neutral3" size={iconSizes.icon16} />
      <NetworkLogo chainId={outputChain} size={16} borderRadius={6} />
      <StyledBridgeAmountText>
        {outputAmount}&nbsp;{tokenOut?.symbol ?? i18n.t('common.unknown')}
      </StyledBridgeAmountText>
    </Flex>
  )
}

export async function parseBridge({
  bridge,
  formatNumber,
  chainId,
}: {
  bridge: BridgeTransactionInfo
  formatNumber: FormatNumberFunctionType
  chainId: UniverseChainId
}): Promise<Partial<Activity>> {
  const [tokenIn, tokenOut] = await Promise.all([
    fetchCurrency(bridge.inputCurrencyId),
    fetchCurrency(bridge.outputCurrencyId),
  ])
  const inputAmount = tokenIn
    ? formatNumber({
        value: parseFloat(CurrencyAmount.fromRawAmount(tokenIn, bridge.inputCurrencyAmountRaw).toSignificant()),
        type: NumberType.TokenNonTx,
      })
    : i18n.t('common.unknown')
  const outputAmount = tokenOut
    ? formatNumber({
        value: parseFloat(CurrencyAmount.fromRawAmount(tokenOut, bridge.outputCurrencyAmountRaw).toSignificant()),
        type: NumberType.TokenNonTx,
      })
    : i18n.t('common.unknown')
  return {
    descriptor: getBridgeDescriptor({ tokenIn, tokenOut, inputAmount, outputAmount }),
    chainId: currencyIdToChain(bridge.inputCurrencyId) ?? chainId,
    outputChainId: currencyIdToChain(bridge.outputCurrencyId) ?? chainId,
    currencies: [tokenIn, tokenOut],
  }
}
