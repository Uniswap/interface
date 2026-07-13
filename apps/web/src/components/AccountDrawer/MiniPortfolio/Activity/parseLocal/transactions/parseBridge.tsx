import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Flex, styled, Text } from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { BridgeTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { getCurrencyFromCurrencyId } from '~/components/AccountDrawer/MiniPortfolio/Activity/getCurrency'
import type { FormatNumberFunctionType } from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/types'
import type { Activity } from '~/components/AccountDrawer/MiniPortfolio/Activity/types'

const StyledBridgeAmountText = styled(Text, {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  variant: 'body2',
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
    getCurrencyFromCurrencyId(bridge.inputCurrencyId),
    getCurrencyFromCurrencyId(bridge.outputCurrencyId),
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
